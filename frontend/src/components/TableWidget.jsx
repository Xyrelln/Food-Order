import React, { useState, useEffect, useContext } from 'react';
import { updateOrderStatus } from '../services/api'; // Import the function from api.js
import { WebSocketContext } from '../contexts/WebSocketContext'; 
import '../assets/styles/TableWidget.css';
import { ReactComponent as ChevronLeftIcon } from '../assets/icons/chevronLeft_icon.svg';
import { ReactComponent as ChevronRightIcon } from '../assets/icons/chevronRight_icon.svg';
import { ReactComponent as ChevronDownIcon } from '../assets/icons/chevronDown_icon.svg';
import { ReactComponent as MoreDetailsIcon } from '../assets/icons/moreDetails_icon.svg';
import { ReactComponent as EditIcon } from '../assets/icons/edit_icon.svg';
import Modal from './Modal';
import OrderDetails from './OrderDetails';
import EditItem from './EditItem';
import { formatOrders } from '../utils/formatOrders';

const TableWidget = ({ title, data, columns, itemsPerPage, maxItemsPerPage, setItems }) => {
  const [currentItemsPerPage, setCurrentItemsPerPage] = useState(itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedEditItem, setSelectedEditItem] = useState(null); 
  const { notifications } = useContext(WebSocketContext); // Access WebSocket notifications
  const [warningMessage, setWarningMessage] = useState(null); // State for warning message

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      if (latestNotification.type === 'NEW_ORDER') {
        const formattedOrder = formatOrders([latestNotification.order])[0]; // Use formatOrders
        setItems((prevItems) => [formattedOrder, ...prevItems]);
      }
    }
  }, [notifications, setItems]);

  const statusOrder = ['In Progress', 'Complete'];

  const handleStatusClick = async (item) => {
    console.log('Status click initiated for item:', item);
    if (!item._id) {
      console.error('Order ID is undefined:', item);
      return;
    }

    // Prevent status change if the order is cancelled
    if (item.status === 'Cancelled') {
      console.log('Cannot change status of a cancelled order');
      setWarningMessage('Cannot change status of a cancelled order');
      setTimeout(() => setWarningMessage(null), 2000); // Hide warning message after 2 seconds
      return;
    }

    const nextStatusIndex = (statusOrder.indexOf(item.status) + 1) % statusOrder.length;
    const nextStatus = statusOrder[nextStatusIndex];
    console.log(`Updating status for order ${item._id} from ${item.status} to ${nextStatus}`);

    try {
      const response = await updateOrderStatus(item._id, nextStatus);
      let updatedOrder = response;

      // Ensure consistent date formatting
      updatedOrder = {
        ...updatedOrder,
        time: new Date(updatedOrder.time).toLocaleTimeString(),
        date: new Date(updatedOrder.time).toLocaleDateString(),
        amount: parseFloat(updatedOrder.amount).toFixed(2)
      };

      // Update the local state with the updated order
      setItems((prevOrders) => {
        return prevOrders.map(order => {
          if (order._id === item._id) {
            return updatedOrder;
          }
          return order;
        });
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / currentItemsPerPage);
  const displayedItems = data.slice(
    (currentPage - 1) * currentItemsPerPage,
    currentPage * currentItemsPerPage
  );

  const handleItemsPerPageChange = (number) => {
    setCurrentItemsPerPage(number);
    setIsDropdownOpen(false);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
  };

  const closeDetailsModal = () => {
    setSelectedOrder(null);
  };

  const openEditModal = (item) => {
    setSelectedEditItem(item);
  };

  const closeEditModal = () => {
    setSelectedEditItem(null);
  };

  return (
    <div className="table-widget">
      <div className="table-header">
        <h3 className="table-title">{title}</h3>
      </div>
      {warningMessage && <div className="warning-message">{warningMessage}</div>}
      <table>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedItems.map((item, index) => (
            <tr key={index}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.accessor === 'details' ? (
                    <MoreDetailsIcon className="details-icon" onClick={() => openDetailsModal(item)} />
                  ) : col.accessor === 'editItem' ? (
                    <EditIcon className="edit-icon" onClick={() => openEditModal(item)} />
                  ) : col.accessor === 'itemPicture' ? (
                    item[col.accessor] ? <img src={item[col.accessor]} alt="Item" className="item-picture" /> : null
                  ) : col.accessor === 'status' ? (
                    <span
                      className={`status ${item[col.accessor].toLowerCase().replace(' ', '-')}`}
                      onClick={() => handleStatusClick(item)}
                    >
                      {item[col.accessor]}
                    </span>
                  ) : col.accessor === 'amount' ? (
                    `$${item[col.accessor]}` // Add dollar sign to the amount
                  ) : (
                    item[col.accessor] // Render string value directly
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <div className="items-per-page">
          <span className="showing-text">Showing</span>
          <div className="dropdown">
            <button className="dropdown-button" onClick={toggleDropdown}>
              {currentItemsPerPage} <ChevronDownIcon />
            </button>
            {isDropdownOpen && totalItems > itemsPerPage && (
              <div className="dropdown-content">
                {[5, 10, 15, 20, 25, 30].map((number) =>
                  number <= maxItemsPerPage ? (
                    <div
                      key={number}
                      onClick={() => handleItemsPerPageChange(number)}
                      className="dropdown-item"
                    >
                      {number}
                    </div>
                  ) : null
                )}
              </div>
            )}
          </div>
        </div>
        <div className="page-info">
          Showing {displayedItems.length} of {totalItems} items
        </div>
        <div className="page-controls">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            <ChevronLeftIcon />
          </button>
          <span className="page-number">{currentPage}</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <Modal show={!!selectedOrder} onClose={closeDetailsModal}>
        {selectedOrder && <OrderDetails data={[selectedOrder]} />}
      </Modal>

      <Modal show={!!selectedEditItem} onClose={closeEditModal}>
        {selectedEditItem && <EditItem item={selectedEditItem} setItems={setItems} onClose={closeEditModal} />}
      </Modal>
    </div>
  );
};

export default TableWidget;