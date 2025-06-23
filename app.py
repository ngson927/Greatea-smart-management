from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from models import db, Supplies, Suppliers, Expenses, UsageRecords, SupplyOrders, StoreStock, RestockRequests, MarketPurchases
from datetime import datetime, timedelta
from sqlalchemy import func, desc
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
CORS(app)

@app.route('/')
def home():
    return "Greatea Inventory API is running."

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ---------- Supplies ----------
@app.route('/supplies', methods=['GET'])
def get_supplies():
    return jsonify([s.to_dict() for s in Supplies.query.all()])

@app.route('/supplies/<int:id>', methods=['GET'])
def get_supply(id):
    return jsonify(Supplies.query.get_or_404(id).to_dict())

@app.route('/supplies', methods=['POST'])
def create_supply():
    data = request.json
    try:
        new_item = Supplies(
            Name=data['Name'],
            Category=data.get('Category'),
            Expiry_Date=datetime.strptime(data['Expiry_Date'], '%Y-%m-%d') if data.get('Expiry_Date') else None,
            Total_Quantity=data.get('Total_Quantity', 0),
            Cost_Per_Unit=data.get('Cost_Per_Unit', 0)
        )
        db.session.add(new_item)
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/supplies/<int:id>', methods=['DELETE'])
def delete_supply(id):
    item = Supplies.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Suppliers ----------
@app.route('/suppliers', methods=['GET'])
def get_suppliers():
    return jsonify([s.to_dict() for s in Suppliers.query.all()])

@app.route('/suppliers', methods=['POST'])
def create_supplier():
    data = request.json
    new_item = Suppliers(
        Name=data['Name'],
        Contact=data.get('Contact'),
        Lead_Time=data.get('Lead_Time')
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/suppliers/<int:id>', methods=['DELETE'])
def delete_supplier(id):
    item = Suppliers.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Expenses ----------
@app.route('/expenses', methods=['GET'])
def get_expenses():
    return jsonify([e.to_dict() for e in Expenses.query.all()])

@app.route('/expenses', methods=['POST'])
def create_expense():
    data = request.json
    new_item = Expenses(
        Date=datetime.strptime(data['Date'], '%Y-%m-%d') if 'Date' in data else datetime.now(),
        Category=data.get('Category'),
        Amount=data['Amount']
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    item = Expenses.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Usage Records ----------
@app.route('/usage', methods=['GET'])
def get_usage():
    return jsonify([u.to_dict() for u in UsageRecords.query.all()])

@app.route('/usage', methods=['POST'])
def create_usage():
    data = request.json
    new_item = UsageRecords(
        Date=datetime.strptime(data['Date'], '%Y-%m-%d') if 'Date' in data else datetime.now(),
        Supply_ID=data['Supply_ID'],
        Quantity_Used=data['Quantity_Used'],
        Location=data.get('Location')
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/usage/<int:id>', methods=['DELETE'])
def delete_usage(id):
    item = UsageRecords.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Supply Orders ----------
@app.route('/orders', methods=['GET'])
def get_orders():
    return jsonify([o.to_dict() for o in SupplyOrders.query.all()])

@app.route('/orders', methods=['POST'])
def create_order():
    data = request.json
    new_item = SupplyOrders(
        Date=datetime.strptime(data['Date'], '%Y-%m-%d') if 'Date' in data else datetime.now(),
        Supplier_ID=data['Supplier_ID'],
        Supply_ID=data['Supply_ID'],
        Quantity_Received=data['Quantity_Received'],
        Total_Cost=data['Total_Cost']
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/orders/<int:id>', methods=['DELETE'])
def delete_order(id):
    item = SupplyOrders.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Store Stock ----------
@app.route('/stock', methods=['GET'])
def get_stock():
    return jsonify([s.to_dict() for s in StoreStock.query.all()])

@app.route('/stock', methods=['POST'])
def create_stock():
    data = request.json
    new_item = StoreStock(
        Supply_ID=data['Supply_ID'],
        Quantity_Available=data['Quantity_Available'],
        Last_Updated=datetime.strptime(data['Last_Updated'], '%Y-%m-%dT%H:%M') if 'Last_Updated' in data else datetime.now()
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/stock/<int:id>', methods=['DELETE'])
def delete_stock(id):
    item = StoreStock.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Restock Requests ----------
@app.route('/restocks', methods=['GET'])
def get_restocks():
    return jsonify([r.to_dict() for r in RestockRequests.query.all()])

@app.route('/restocks', methods=['POST'])
def create_restock():
    data = request.json
    new_item = RestockRequests(
        Date=datetime.strptime(data['Date'], '%Y-%m-%d') if 'Date' in data else datetime.now(),
        Supply_ID=data['Supply_ID'],
        Quantity_Requested=data['Quantity_Requested'],
        Request_Type=data.get('Request_Type', 'Transfer from Inventory')
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/restocks/<int:id>', methods=['DELETE'])
def delete_restock(id):
    item = RestockRequests.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Market Purchases ----------
@app.route('/purchases', methods=['GET'])
def get_purchases():
    return jsonify([p.to_dict() for p in MarketPurchases.query.all()])

@app.route('/purchases', methods=['POST'])
def create_purchase():
    data = request.json
    new_item = MarketPurchases(
        Date=datetime.strptime(data['Date'], '%Y-%m-%d') if 'Date' in data else datetime.now(),
        Item_Name=data['Item_Name'],
        Quantity=data.get('Quantity', 1),
        Cost=data['Cost'],
        Category=data.get('Category')
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.to_dict()), 201

@app.route('/purchases/<int:id>', methods=['DELETE'])
def delete_purchase(id):
    item = MarketPurchases.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# ---------- Advanced Analytics ----------

# Expiring Soon Items
@app.route('/analytics/expiring-soon', methods=['GET'])
def get_expiring_soon():
    today = datetime.now().date()
    thirty_days_later = today + timedelta(days=30)
    
    items = Supplies.query.filter(
        Supplies.Expiry_Date.between(today, thirty_days_later)
    ).all()
    
    result = []
    for item in items:
        days_until_expiry = (item.Expiry_Date - today).days
        stock = StoreStock.query.filter_by(Supply_ID=item.Supply_ID).first()
        
        result.append({
            **item.to_dict(),
            'days_until_expiry': days_until_expiry,
            'current_stock': stock.Quantity_Available if stock else 0,
            'priority': 'High' if days_until_expiry < 7 else ('Medium' if days_until_expiry < 14 else 'Low')
        })
    
    return jsonify(result)

# Stock Alerts
@app.route('/analytics/stock-alerts', methods=['GET'])
def get_stock_alerts():
    alerts = []
    
    for stock in StoreStock.query.all():
        if stock.Quantity_Available < 10:
            supply = Supplies.query.get(stock.Supply_ID)
            usage = db.session.query(func.sum(UsageRecords.Quantity_Used)).filter(
                UsageRecords.Supply_ID == stock.Supply_ID,
                UsageRecords.Date >= datetime.now().date() - timedelta(days=30)
            ).scalar() or 0
            
            daily_usage = usage / 30 if usage > 0 else 0.1
            days_remaining = int(stock.Quantity_Available / daily_usage) if daily_usage > 0 else 999
            
            status = "Critical" if days_remaining < 3 else ("Warning" if days_remaining < 7 else "Low")
            
            alerts.append({
                'Supply_ID': stock.Supply_ID,
                'Name': supply.Name if supply else f"Supply {stock.Supply_ID}",
                'Category': supply.Category if supply else 'Unknown',
                'Current_Stock': float(stock.Quantity_Available),
                'Daily_Usage': float(daily_usage),
                'Days_Remaining': days_remaining if days_remaining < 365 else "365+",
                'Status': status
            })
    
    return jsonify(alerts)

# Spending Trends
@app.route('/analytics/spending-trends', methods=['GET'])
def get_spending_trends():
    trends = []
    
    for category in db.session.query(Expenses.Category).distinct():
        category_name = category[0] or "Uncategorized"
        
        monthly_totals = db.session.query(
            func.date_format(Expenses.Date, '%Y-%m').label('month'),
            func.sum(Expenses.Amount).label('total')
        ).filter(
            Expenses.Category == category_name
        ).group_by(
            'month'
        ).all()
        
        for month, total in monthly_totals:
            found = False
            for trend in trends:
                if trend['date'] == month:
                    trend[category_name] = float(total)
                    found = True
                    break
            
            if not found:
                trends.append({'date': month, category_name: float(total)})
    
    # Sort by date
    trends.sort(key=lambda x: x['date'])
    
    # Get all categories
    categories = [c[0] or "Uncategorized" for c in db.session.query(Expenses.Category).distinct()]
    
    return jsonify({
        'trends': trends,
        'categories': categories
    })
    
    # Sort by date
    trends.sort(key=lambda x: x['date'])
    
    # Get all categories
    categories = [c[0] or "Uncategorized" for c in db.session.query(Expenses.Category).distinct()]
    
    return jsonify({
        'trends': trends,
        'categories': categories
    })

# Dashboard Summary
@app.route('/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)
    
    # 1. Low stock count
    low_stock_count = StoreStock.query.filter(StoreStock.Quantity_Available < 10).count()
    
    # 2. Expiring soon count
    expiring_soon_count = Supplies.query.filter(
        Supplies.Expiry_Date.isnot(None),
        Supplies.Expiry_Date.between(today, today + timedelta(days=30))
    ).count()
    
    # 3. Pending restock requests
    pending_restocks = RestockRequests.query.count()
    
    # 4. Total inventory value
    inventory_value = db.session.query(
        func.sum(Supplies.Total_Quantity * Supplies.Cost_Per_Unit)
    ).scalar() or 0
    
    # 5. Monthly expenses
    monthly_expenses = db.session.query(
        func.sum(Expenses.Amount)
    ).filter(
        Expenses.Date.between(thirty_days_ago, today)
    ).scalar() or 0
    
    # 6. Purchase ratio
    supply_expenses = db.session.query(
        func.sum(SupplyOrders.Total_Cost)
    ).filter(
        SupplyOrders.Date.between(thirty_days_ago, today)
    ).scalar() or 0
    
    market_expenses = db.session.query(
        func.sum(MarketPurchases.Cost)
    ).filter(
        MarketPurchases.Date.between(thirty_days_ago, today)
    ).scalar() or 0
    
    total_purchase_expenses = supply_expenses + market_expenses
    
    if total_purchase_expenses > 0:
        purchase_ratio = {
            'supply': float(supply_expenses),
            'market': float(market_expenses),
            'supply_percentage': round((supply_expenses / total_purchase_expenses) * 100, 2),
            'market_percentage': round((market_expenses / total_purchase_expenses) * 100, 2)
        }
    else:
        purchase_ratio = {
            'supply': 0,
            'market': 0,
            'supply_percentage': 0,
            'market_percentage': 0
        }
    
    # 7. Top supplies
    top_supplies = db.session.query(
        Supplies.Supply_ID,
        Supplies.Name,
        func.sum(UsageRecords.Quantity_Used).label('total_used')
    ).join(
        UsageRecords, UsageRecords.Supply_ID == Supplies.Supply_ID
    ).filter(
        UsageRecords.Date.between(thirty_days_ago, today)
    ).group_by(
        Supplies.Supply_ID
    ).order_by(
        desc('total_used')
    ).limit(5).all()
    
    top_supplies_list = [
        {'id': s.Supply_ID, 'name': s.Name, 'quantity_used': float(s.total_used)}
        for s in top_supplies
    ]
    
    return jsonify({
        'low_stock_count': low_stock_count,
        'expiring_soon_count': expiring_soon_count,
        'pending_restocks': pending_restocks,
        'inventory_value': float(inventory_value),
        'monthly_expenses': float(monthly_expenses),
        'purchase_ratio': purchase_ratio,
        'top_supplies': top_supplies_list,
        'report_date': today.isoformat()
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
