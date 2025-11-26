import React from 'react';
import { Outlet } from 'react-router-dom';

const CustomerLayout: React.FC = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default CustomerLayout;
