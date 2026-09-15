const express = require('express');
const app = express();
const path = require('path');

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// In-memory data (Supermarket)
let categories = [
    { id: 1, name: 'Fruits', description: 'Fresh fruits from the farm' },
    { id: 2, name: 'Dairy', description: 'Milk, cheese and more' },
    { id: 3, name: 'Bakery', description: 'Freshly baked bread' }
];

let products = [
    { id: 1, name: 'Apple', price: 5, categoryId: 1, stock: 100 },
    { id: 2, name: 'Banana', price: 8, categoryId: 1, stock: 50 },
    { id: 3, name: 'Milk', price: 12, categoryId: 2, stock: 30 },
    { id: 4, name: 'Cheese', price: 20, categoryId: 2, stock: 15 },
    { id: 5, name: 'Baguette', price: 10, categoryId: 3, stock: 40 }
];

// Game stages definition
const gameStages = [
    { id: 1, description: "הצג את כל המוצרים בסופר (ללא פרמטרים כלל וללא Request Body)." },
    { id: 2, description: "הצג רק את הקטגוריה שה-ID שלה הוא 2. (ללא Request Body)." },
    { id: 3, description: "הצג את כל המוצרים שהמחיר המינימלי שלהם הוא 10 והמקסימלי הוא 20 (ללא Request Body)." },
    { id: 4, description: "הוסף מוצר חדש! שלח בקשת POST עם Request Body המכיל name." },
    { id: 5, description: "עדכן את המחיר של המוצר עם ID 1. (השתמש ב-Route Parameter וב-Request Body עבור המחיר)." },
    { id: 6, description: "מחק את הקטגוריה שה-ID שלה הוא 3 (ללא Request Body)." },
    { id: 7, description: "הצג את כל המוצרים ששייכים לקטגוריה 1 (ללא Request Body)." },
    { id: 8, description: "נסה לשלוף מוצר שלא קיים (למשל מזהה 999) וודא קבלת שגיאה (ללא Request Body)." }
];

// Helper function to check if body exists
const hasBody = (req) => {
    return req.body && Object.keys(req.body).length > 0;
};

// Detailed validation functions with accurate error source identification
const validations = {
    1: (req) => {
        if (req.method !== 'GET') return "שגיאה ב-Method";
        if (req.path !== '/api/products') return "שגיאה ב-URL";
        if (Object.keys(req.query).length > 0) return "שגיאה ב-Query Parameters";
        if (hasBody(req)) return "אין צורך להשתמש ב-Request Body בשלב זה";
        return true;
    },
    2: (req) => {
        if (req.method !== 'GET') return "שגיאה ב-Method";
        if (req.path !== '/api/categories/2' && !(req.path === '/api/categories' && req.query.id === '2')) return "שגיאה ב-URL";
        if (hasBody(req)) return "אין צורך להשתמש ב-Request Body בשלב זה";
        return true;
    },
    3: (req) => {
        if (req.method !== 'GET') return "שגיאה ב-Method";
        if (req.path !== '/api/products') return "שגיאה ב-URL";
        if (!req.query.minPrice || !req.query.maxPrice) return "שגיאה ב-Query Parameters";
        if (hasBody(req)) return "אין צורך להשתמש ב-Request Body בשלב זה";
        return true;
    },
    4: (req) => {
        if (req.method !== 'POST') return "שגיאה ב-Method";
        if (req.path !== '/api/products') return "שגיאה ב-URL";
        if (!hasBody(req) || !req.body.name) return "שגיאה ב-Request Body";
        return true;
    },
    5: (req) => {
        if (req.method !== 'PATCH') return "שגיאה ב-Method";
        if (req.path !== '/api/products/1') return "שגיאה ב-URL";
        if (!hasBody(req) || req.body.price === undefined) return "שגיאה ב-Request Body";
        return true;
    },
    6: (req) => {
        if (req.method !== 'DELETE') return "שגיאה ב-Method";
        if (req.path !== '/api/categories/3') return "שגיאה ב-URL";
        if (Object.keys(req.query).length > 0) return "שגיאה ב-Query Parameters";
        if (hasBody(req)) return "אין צורך להשתמש ב-Request Body בשלב זה";
        return true;
    },
    7: (req) => {
        if (req.method !== 'GET') return "שגיאה ב-Method";
        if (req.path !== '/api/categories/1/products') return "שגיאה ב-URL";
        if (hasBody(req)) return "אין צורך להשתמש ב-Request Body בשלב זה";
        return true;
    },
    8: (req) => {
        if (req.method !== 'GET') return "שגיאה ב-Method";
        if (req.path !== '/api/products/999') return "שגיאה ב-URL";
        if (hasBody(req)) return "אין צורך להשתמש ב-Request Body בשלב זה";
        return true;
    }
};

// Middleware to attach stage-passing headers and specific failure reasons
app.use((req, res, next) => {
    const stageId = req.headers['x-stage-id'];
    if (stageId && validations[stageId]) {
        const result = validations[stageId](req);
        if (result === true) {
            res.setHeader('X-Stage-Passed', 'true');
        } else {
            res.setHeader('X-Stage-Passed', 'false');
            res.setHeader('X-Error-Reason', encodeURIComponent(result));
        }
    }
    next();
});

// --- API Routes (RESTful) ---

app.get('/api/products', (req, res) => {
    let result = [...products];
    if (req.query.minPrice) result = result.filter(p => p.price >= Number(req.query.minPrice));
    if (req.query.maxPrice) result = result.filter(p => p.price <= Number(req.query.maxPrice));
    res.json(result);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found!" });
    res.json(product);
});

app.post('/api/products', (req, res) => {
    const newProduct = {
        id: products.length > 0 ? products[products.length - 1].id + 1 : 1,
        name: req.body.name,
        price: req.body.price || 10,
        categoryId: req.body.categoryId || 1,
        stock: req.body.stock || 20
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found!" });
    if (req.body.price !== undefined) product.price = Number(req.body.price);
    res.json(product);
});

app.delete('/api/categories/:id', (req, res) => {
    const catId = Number(req.params.id);
    const initialLength = categories.length;
    categories = categories.filter(c => c.id !== catId);
    if (categories.length === initialLength) {
        return res.status(404).json({ error: "Category not found!" });
    }
    res.json({ message: "Category deleted successfully" });
});

app.get('/api/categories', (req, res) => {
    res.json(categories);
});

app.get('/api/categories/2', (req, res) => {
    const cat = categories.find(c => c.id === 2);
    res.json(cat);
});

app.get('/api/categories/:id', (req, res) => {
    const cat = categories.find(c => c.id === Number(req.params.id));
    if (!cat) return res.status(404).json({ error: "Category not found!" });
    res.json(cat);
});

app.get('/api/categories/:id/products', (req, res) => {
    const catId = Number(req.params.id);
    const catProducts = products.filter(p => p.categoryId === catId);
    res.json(catProducts);
});

// --- SSR Routes ---

app.get('/', (req, res) => {
    res.render('index', { stages: gameStages });
});

app.get('/schemas', (req, res) => {
    const dbSchemas = {
        products: { id: "Number", name: "String", price: "Number", categoryId: "Number", stock: "Number" },
        categories: { id: "Number", name: "String", description: "String" }
    };
    res.render('schemas', { schemas: dbSchemas });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});