-- Drop and recreate the database
DROP DATABASE IF EXISTS greatea_inventory_db;
CREATE DATABASE greatea_inventory_db;
USE greatea_inventory_db;

-- Suppliers Table
CREATE TABLE Suppliers (
    Supplier_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Contact VARCHAR(100),
    Lead_Time INT
);

-- Supplies Table
CREATE TABLE Supplies (
    Supply_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Category VARCHAR(50),
    Expiry_Date DATE,
    Total_Quantity DECIMAL(10,2),
    Cost_Per_Unit DECIMAL(10,2)
);

-- Supply Orders Table
CREATE TABLE Supply_Orders (
    Order_ID INT PRIMARY KEY AUTO_INCREMENT,
    Date DATE NOT NULL,
    Supplier_ID INT,
    Supply_ID INT,
    Quantity_Received DECIMAL(10,2),
    Total_Cost DECIMAL(10,2),
    FOREIGN KEY (Supplier_ID) REFERENCES Suppliers(Supplier_ID) ON DELETE CASCADE,
    FOREIGN KEY (Supply_ID) REFERENCES Supplies(Supply_ID) ON DELETE CASCADE
);

-- Usage Records Table
CREATE TABLE Usage_Records (
    Usage_ID INT PRIMARY KEY AUTO_INCREMENT,
    Date DATE NOT NULL,
    Supply_ID INT,
    Quantity_Used DECIMAL(10,2),
    Location VARCHAR(50),
    FOREIGN KEY (Supply_ID) REFERENCES Supplies(Supply_ID) ON DELETE CASCADE
);

-- Expenses Table
CREATE TABLE Expenses (
    Expense_ID INT PRIMARY KEY AUTO_INCREMENT,
    Date DATE NOT NULL,
    Category VARCHAR(50),
    Amount DECIMAL(10,2)
);

-- Store Stock Table
CREATE TABLE Store_Stock (
    Stock_ID INT PRIMARY KEY AUTO_INCREMENT,
    Supply_ID INT,
    Quantity_Available DECIMAL(10,2),
    Last_Updated DATETIME,
    FOREIGN KEY (Supply_ID) REFERENCES Supplies(Supply_ID) ON DELETE CASCADE
);

-- Restock Requests Table
CREATE TABLE Restock_Requests (
    Request_ID INT PRIMARY KEY AUTO_INCREMENT,
    Date DATE NOT NULL,
    Supply_ID INT,
    Quantity_Requested DECIMAL(10,2),
    Request_Type ENUM('Transfer from Inventory', 'Purchase from Supplier'),
    FOREIGN KEY (Supply_ID) REFERENCES Supplies(Supply_ID) ON DELETE CASCADE
);

-- Market Purchases Table
CREATE TABLE Market_Purchases (
    Purchase_ID INT PRIMARY KEY AUTO_INCREMENT,
    Date DATE NOT NULL,
    Item_Name VARCHAR(100),
    Quantity DECIMAL(10,2),
    Cost DECIMAL(10,2),
    Category VARCHAR(50)
);

-- Sample Data
INSERT INTO Suppliers (Name, Contact, Lead_Time) VALUES
    ('Fresh Produce Co.', '123-456-7890', 5),
    ('Dairy Partners', '987-654-3210', 3),
    ('Syrup & Co.', '456-789-0123', 4);

INSERT INTO Supplies (Name, Category, Expiry_Date, Total_Quantity, Cost_Per_Unit) VALUES
    ('Green Tea Leaves', 'Tea', '2025-12-31', 100.00, 5.50),
    ('Milk', 'Dairy', '2025-06-01', 50.00, 3.20),
    ('Vanilla Syrup', 'Flavoring', '2025-09-15', 75.00, 4.75);

INSERT INTO Supply_Orders (Date, Supplier_ID, Supply_ID, Quantity_Received, Total_Cost) VALUES
    ('2025-04-01', 1, 1, 30.00, 165.00),
    ('2025-04-02', 2, 2, 25.00, 80.00);

INSERT INTO Usage_Records (Date, Supply_ID, Quantity_Used, Location) VALUES
    ('2025-04-10', 1, 10.00, 'Main Store'),
    ('2025-04-11', 2, 5.00, 'Branch A');

INSERT INTO Expenses (Date, Category, Amount) VALUES
    ('2025-04-01', 'Supply Purchase', 165.00),
    ('2025-04-02', 'Supply Purchase', 80.00);

INSERT INTO Store_Stock (Supply_ID, Quantity_Available, Last_Updated) VALUES
    (1, 90.00, '2025-04-12 10:00:00'),
    (2, 45.00, '2025-04-12 10:00:00');

INSERT INTO Restock_Requests (Date, Supply_ID, Quantity_Requested, Request_Type) VALUES
    ('2025-04-12', 1, 20.00, 'Purchase from Supplier'),
    ('2025-04-13', 2, 10.00, 'Transfer from Inventory');

INSERT INTO Market_Purchases (Date, Item_Name, Quantity, Cost, Category) VALUES
    ('2025-04-10', 'Strawberries', 5.00, 25.00, 'Fruits'),
    ('2025-04-11', 'Honey', 2.00, 15.00, 'Sweeteners');
