import React from 'react';
import { Outlet } from 'react-router-dom';
import TableBanner from './TableBanner';

/**
 * Every diner screen sits under the band that says which table they are at,
 * so leaving is always one tap away rather than buried on one page.
 */
const CustomerLayout = () => {
  return (
    <div>
      <TableBanner />
      <Outlet />
    </div>
  );
};

export default CustomerLayout;
