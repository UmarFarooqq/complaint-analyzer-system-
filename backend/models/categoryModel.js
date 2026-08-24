const db = require("../config/db");

async function findCategoryByName(categoryName) {
  const [rows] = await db.execute(
    `SELECT * FROM categories WHERE category_name = ? LIMIT 1`,
    [categoryName]
  );

  return rows[0];
}

async function getAllCategories() {
  const [rows] = await db.execute(
    `SELECT * FROM categories ORDER BY category_name ASC`
  );

  return rows;
}

module.exports = {
  findCategoryByName,
  getAllCategories
};
