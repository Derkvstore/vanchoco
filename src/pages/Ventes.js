const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config(); // Charge les variables d'environnement depuis .env

// Configuration de la connexion à la base de données PostgreSQL en utilisant process.env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('Connecté à la base de données PostgreSQL !');
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le client PostgreSQL', err);
  process.exit(-1);
});

// Route pour obtenir toutes les ventes avec leurs articles et les noms des clients
router.get('/ventes', async (req, res) => {
  try {
    const query = `
      SELECT
          v.id AS vente_id,
          v.date_vente,
          v.montant_total,
          v.montant_paye,
          v.statut_paiement,
          c.nom AS client_nom,
          JSON_AGG(
              JSON_BUILD_OBJECT(
                  'item_id', vi.id,
                  'imei', vi.imei,
                  'quantite_vendue', vi.quantite_vendue,
                  'prix_unitaire_vente', vi.prix_unitaire_vente,
                  'marque', vi.marque,
                  'modele', vi.modele,
                  'stockage', vi.stockage,
                  'type_carton', vi.type_carton,
                  'type', vi.type
              )
          ) AS articles
      FROM
          ventes v
      JOIN
          clients c ON v.client_id = c.id
      JOIN
          vente_items vi ON v.id = vi.vente_id
      GROUP BY
          v.id, c.nom
      ORDER BY
          v.date_vente DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des ventes:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des ventes.' });
  }
});

// Route pour créer une nouvelle vente
router.post('/ventes', async (req, res) => {
  const { nom_client, items, montant_paye } = req.body;
  let clientDb; // Variable pour la connexion client de la transaction

  if (!nom_client || !items || items.length === 0) {
    return res.status(400).json({ error: 'Le nom du client et les articles sont requis.' });
  }

  try {
    clientDb = await pool.connect(); // Obtenir un client de la transaction
    await clientDb.query('BEGIN'); // Démarrer la transaction

    // 1. Récupérer ou créer le client
    let clientId;
    const clientResult = await clientDb.query('SELECT id FROM clients WHERE nom = $1', [nom_client]);
    if (clientResult.rows.length > 0) {
      clientId = clientResult.rows[0].id;
    } else {
      const newClientResult = await clientDb.query(
        'INSERT INTO clients (nom, telephone) VALUES ($1, $2) RETURNING id',
        [nom_client, ''] // Le numéro de téléphone est vide par défaut ici
      );
      clientId = newClientResult.rows[0].id;
    }

    // 2. Calculer le montant total de la vente et vérifier la disponibilité des produits
    let montantTotal = 0;
    const productUpdates = [];
    const saleItems = []; // Pour stocker les articles à insérer dans vente_items

    for (const item of items) {
      const productResult = await clientDb.query(
        'SELECT id, quantite, prix_vente, marque, modele, type_carton, stockage, type FROM products WHERE imei = $1',
        [item.imei]
      );

      if (productResult.rows.length === 0) {
        await clientDb.query('ROLLBACK'); // Annuler la transaction
        return res.status(404).json({ error: `Produit avec IMEI "${item.imei}" non trouvé.` });
      }

      const product = productResult.rows[0];
      if (product.quantite < item.quantite_vendue) {
        await clientDb.query('ROLLBACK'); // Annuler la transaction
        return res.status(400).json({ error: `Quantité insuffisante pour le produit avec IMEI "${item.imei}". Disponible: ${product.quantite}, Demandé: ${item.quantite_vendue}.` });
      }

      const prixUnitaireVente = parseFloat(product.prix_vente);
      montantTotal += item.quantite_vendue * prixUnitaireVente;

      productUpdates.push({ id: product.id, newQuantity: product.quantite - item.quantite_vendue });
      saleItems.push({
        produit_id: product.id, // L'ID du produit de la table products
        imei: item.imei,
        quantite_vendue: item.quantite_vendue,
        prix_unitaire_vente: prixUnitaireVente,
        marque: product.marque,
        modele: product.modele,
        type_carton: product.type_carton,
        stockage: product.stockage,
        type: product.type,
      });
    }

    // Déterminer le statut de paiement initial
    let statutPaiement = 'en_attente_paiement';
    const parsedMontantPaye = parseFloat(montant_paye);

    if (parsedMontantPaye >= montantTotal) {
      statutPaiement = 'payee_integralement';
    } else if (parsedMontantPaye > 0) {
      statutPaiement = 'paiement_partiel';
    }

    // 3. Insérer la nouvelle vente dans la table `ventes`
    const newSaleResult = await clientDb.query(
      'INSERT INTO ventes (client_id, date_vente, montant_total, montant_paye, statut_paiement) VALUES ($1, NOW(), $2, $3, $4) RETURNING id',
      [clientId, montantTotal, parsedMontantPaye, statutPaiement]
    );
    const nouvelleVenteId = newSaleResult.rows[0].id;

    // 4. Insérer les articles de la vente dans la table `vente_items`
    for (const item of saleItems) {
      await clientDb.query(
        `INSERT INTO vente_items (vente_id, produit_id, imei, quantite_vendue, prix_unitaire_vente, marque, modele, type_carton, stockage, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [nouvelleVenteId, item.produit_id, item.imei, item.quantite_vendue, item.prix_unitaire_vente, item.marque, item.modele, item.type_carton, item.stockage, item.type]
      );
    }

    // 5. Mettre à jour les quantités de produits en stock
    for (const update of productUpdates) {
      await clientDb.query(
        'UPDATE products SET quantite = $1 WHERE id = $2',
        [update.newQuantity, update.id]
      );
    }

    await clientDb.query('COMMIT'); // Valider la transaction
    res.status(201).json({ message: 'Vente enregistrée avec succès!', venteId: nouvelleVenteId });

  } catch (error) {
    if (clientDb) { // Assurez-vous que clientDb est défini avant de faire un rollback
      await clientDb.query('ROLLBACK'); // En cas d'erreur, annuler toutes les opérations
    }
    console.error('Erreur lors de l\'enregistrement de la vente:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement de la vente.' });
  } finally {
    if (clientDb) { // Assurez-vous que clientDb est défini avant de le libérer
      clientDb.release(); // Toujours libérer le client de la transaction
    }
  }
});

module.exports = router;