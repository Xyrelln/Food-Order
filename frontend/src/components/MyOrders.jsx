import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TableWidget from './TableWidget';
import '../assets/styles/MyOrders.css';
import { formatOrders } from '../utils/formatOrders';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get('http://localhost:5555/orders', { withCredentials: true })
      .then((response) => {
        console.log('Fetched orders:', response.data);
        const sortedOrders = response.data.sort((a, b) => new Date(b.time) - new Date(a.time));
        setOrders(formatOrders(sortedOrders));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load orders:', error);
        setError('Failed to load orders');
        setLoading(false);
      });
  }, []);

  const columns = [
    { header: 'Customer Name', accessor: 'customerName' },
    { header: "Meal Item", accessor: 'mealName'},
    { header: 'Date', accessor: 'date' },
    { header: 'Time', accessor: 'time' },
    { header: 'Amount', accessor: 'amount' },
    { header: 'Payment Type', accessor: 'paymentType' },
    { header: 'Status', accessor: 'status' },
    { header: 'Details', accessor: 'details' },
  ];

  return (
    <div className="my-orders-page">
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <TableWidget
          title="New Orders"
          data={orders} 
          columns={columns}
          itemsPerPage={15}
          maxItemsPerPage={30}
          setItems={setOrders} 
        />
      )}
    </div>
  );
};

export default MyOrders;
