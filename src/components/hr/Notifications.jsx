import React, { useEffect, useState } from 'react';
import { getNotifications } from '../../api/employeeApi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications();
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications', error);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <strong>{notification.name.name}</strong>: {notification.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
