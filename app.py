from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)

# Configure the database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy()

# Enable CORS for all routes
CORS(app)

# --- Database Models ---

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)

class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    order_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False, default='Processing')
    total_price = db.Column(db.Float, nullable=False)
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_purchase = db.Column(db.Float, nullable=False)

# --- API Endpoints ---

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    data = request.json
    product_id = data.get('product_id')
    quantity = data.get('quantity')
    user_id = 1

    if not product_id or not quantity:
        return jsonify({'message': 'Missing product_id or quantity'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    cart_item = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if cart_item:
        cart_item.quantity += quantity
    else:
        new_cart_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(new_cart_item)

    db.session.commit()
    return jsonify({'message': 'Item added to cart successfully'}), 200

@app.route('/get_cart', methods=['GET'])
def get_cart():
    user_id = 1
    cart_items = CartItem.query.filter_by(user_id=user_id).all()

    cart_data = []
    for item in cart_items:
        product = Product.query.get(item.product_id)
        if product:
            cart_data.append({
                'id': item.id,
                'product_id': product.id,
                'name': product.name,
                'price': product.price,
                'quantity': item.quantity,
            })
    return jsonify(cart_data), 200

@app.route('/place_order', methods=['POST'])
def place_order():
    user_id = 1
    cart_items = CartItem.query.filter_by(user_id=user_id).all()

    if not cart_items:
        return jsonify({'message': 'Your cart is empty. Nothing to order.'}), 400

    total_price = sum(item.quantity * Product.query.get(item.product_id).price for item in cart_items if Product.query.get(item.product_id))

    new_order = Order(user_id=user_id, total_price=total_price)
    db.session.add(new_order)
    db.session.flush()

    for item in cart_items:
        product = Product.query.get(item.product_id)
        if product:
            new_order_item = OrderItem(
                order_id=new_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price_at_purchase=product.price
            )
            db.session.add(new_order_item)
            db.session.delete(item)

    db.session.commit()
    return jsonify({'message': 'Order placed successfully!', 'order_id': new_order.id}), 200

@app.route('/get_orders', methods=['GET'])
def get_orders():
    user_id = 1
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.order_date.desc()).all()

    orders_data = []
    for order in orders:
        order_items_data = []
        for item in order.items:
            product = Product.query.get(item.product_id)
            if product:
                order_items_data.append({
                    'name': product.name,
                    'quantity': item.quantity,
                    'price': item.price_at_purchase
                })

        orders_data.append({
            'order_id': order.id,
            'date': order.order_date.strftime("%B %d, %Y"),
            'status': order.status,
            'total_price': order.total_price,
            'items': order_items_data
        })
    return jsonify(orders_data), 200

if __name__ == '__main__':
    with app.app_context():
        db.init_app(app)
        db.create_all()
        if not Product.query.first():
            products_to_add = [
                Product(name='Nike Free RN', price=149.99),
                Product(name='Nike Free RN', price=149.99),
                Product(name='Nike Free TR', price=129.99),
                Product(name='Nike Free TR', price=129.99),
                Product(name='Nike GS Pink', price=129.99),
                Product(name='Nike Get 5', price=129.99),
                Product(name='New Mens Shoes', price=79.99),
                Product(name='New Sneaker 2', price=99.99),
                Product(name='New Sneaker 3', price=89.99),
            ]
            db.session.add_all(products_to_add)
            db.session.commit()
    app.run(debug=True)