# Greatea Smart Management

A comprehensive backend API developed by **Son Nguyen** for managing inventory, tracking financials, and optimizing operations for Greatea Suwanee LLC.

## Features

- **Inventory Management**: Track supplies, monitor expiration dates, and manage stock levels
- **Financial Tracking**: Record expenses, analyze spending patterns, and identify cost-saving opportunities
- **Advanced Analytics**: Demand forecasting, supplier performance metrics, and restocking recommendations
- **Store Operations**: Transfer stock between storage and store, log usage, and manage restock requests

## Technologies Used

- **Backend**: Flask, SQLAlchemy
- **Database**: MySQL
- **Deployment**: Docker (optional)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd greatea-smart-management
```

2. Create a virtual environment and activate it
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up environment variables
Create a `.env` file with the following variables:
```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_NAME=greatea_inventory_db
SECRET_KEY=your_secret_key
```

5. Initialize the database
```bash
# Run the SQL script to create the database and tables
mysql -u your_db_user -p < database/create_database.sql

# Start the application
python app.py
```

## API Endpoints

### Basic CRUD Operations

#### Supplies
- `GET /supplies`
- `GET /supplies/<id>`
- `POST /supplies`
- `PUT /supplies/<id>`
- `DELETE /supplies/<id>`

#### Suppliers
- `GET /suppliers`
- `GET /suppliers/<id>`
- `POST /suppliers`
- `PUT /suppliers/<id>`
- `DELETE /suppliers/<id>`

#### Expenses
- `GET /expenses`
- `GET /expenses/<id>`
- `POST /expenses`
- `PUT /expenses/<id>`
- `DELETE /expenses/<id>`

#### Usage Records
- `GET /usage`
- `GET /usage/<id>`
- `POST /usage`
- `PUT /usage/<id>`
- `DELETE /usage/<id>`

#### Supply Orders
- `GET /orders`
- `GET /orders/<id>`
- `POST /orders`
- `PUT /orders/<id>`
- `DELETE /orders/<id>`

#### Store Stock
- `GET /stock`
- `GET /stock/<id>`
- `POST /stock`
- `PUT /stock/<id>`
- `DELETE /stock/<id>`

#### Restock Requests
- `GET /restocks`
- `GET /restocks/<id>`
- `POST /restocks`
- `PUT /restocks/<id>`
- `DELETE /restocks/<id>`

#### Market Purchases
- `GET /purchases`
- `GET /purchases/<id>`
- `POST /purchases`
- `PUT /purchases/<id>`
- `DELETE /purchases/<id>`

### Advanced Analytics Endpoints

- `GET /analytics/expiring-soon`
- `GET /analytics/stock-alerts`
- `GET /analytics/spending-trends`
- `GET /analytics/supplier-performance`
- `GET /analytics/demand-forecast`
- `GET /analytics/restock-recommendations`

### Report Endpoints

- `GET /dashboard/summary`
- `GET /reports/inventory`
- `GET /reports/financial`

### Operations Endpoints

- `POST /operations/transfer-stock`

## Frontend Integration

This API supports JSON-formatted responses and pagination, enabling smooth integration with frontend dashboards or mobile apps.

## Development

To run in development mode:
```bash
python app.py
```

The API will be available at `http://localhost:5000`.

## Author

**Son Nguyen**  
Developer | Greatea Suwanee LLC  
Email: greateasuwanee@gmail.com

## License

This project is intended for educational and internal business use only.
