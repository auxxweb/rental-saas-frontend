import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import TenantLayout from '@/app-routes/tenant/layout'

import Home from '@/app-routes/page'
import LoginPage from '@/app-routes/login/page'
import RegisterTenantPage from '@/app-routes/register/page'
import VerifyPasswordChangePage from '@/app-routes/verify-password-change/page'

import ShopDashboard from '@/app-routes/shop/dashboard/page'
import CustomersPage from '@/app-routes/shop/customers/page'
import ShopCustomerDetailPage from '@/app-routes/shop/customers/[id]/page'
import ShopCategoriesPage from '@/app-routes/shop/categories/page'
import ProductsPage from '@/app-routes/shop/products/page'
import NewProductPage from '@/app-routes/shop/products/new/page'
import ProductViewPage from '@/app-routes/shop/products/[id]/page'
import EditProductPage from '@/app-routes/shop/products/[id]/edit/page'
import ProductUnitsPage from '@/app-routes/shop/products/[id]/units/page'
import JobsPage from '@/app-routes/shop/jobs/page'
import NewJobPage from '@/app-routes/shop/jobs/new/page'
import JobDetailPage from '@/app-routes/shop/jobs/[id]/page'
import ShopInvoicesPage from '@/app-routes/shop/invoices/page'
import NewInvoicePage from '@/app-routes/shop/invoices/new/page'
import InvoiceDetailPage from '@/app-routes/shop/invoices/[id]/page'
import ReportsPage from '@/app-routes/shop/reports/page'
import ShopSupportPage from '@/app-routes/shop/support/page'
import ShopSettingsPage from '@/app-routes/shop/settings/page'
import ChangePasswordPage from '@/app-routes/shop/settings/password/page'
import MyPlanPage from '@/app-routes/shop/my-plan/page'
import InventoryHubPage from '@/app-routes/shop/inventory/page'
import ShopInventoryCalendarPage from '@/app-routes/shop/inventory/calendar/page'
import DamagePage from '@/app-routes/shop/inventory/damage/page'
import MaintenancePage from '@/app-routes/shop/inventory/maintenance/page'

import SuperAdminDashboard from '@/app-routes/super-admin/dashboard/page'
import ShopsPage from '@/app-routes/super-admin/shops/page'
import NewShopPage from '@/app-routes/super-admin/shops/new/page'
import ShopDetailPage from '@/app-routes/super-admin/shops/[id]/page'
import EditShopPage from '@/app-routes/super-admin/shops/[id]/edit/page'
import SubscriptionsPage from '@/app-routes/super-admin/subscriptions/page'
import SubscriptionPlansPage from '@/app-routes/super-admin/plans/page'
import PlanUpgradeRequestsPage from '@/app-routes/super-admin/plan-requests/page'
import GlobalSettingsPage from '@/app-routes/super-admin/global-settings/page'
import SuperAdminSupportPage from '@/app-routes/super-admin/support/page'
import ChatPage from '@/app-routes/super-admin/chat/page'
import SuperAdminReportsPage from '@/app-routes/super-admin/reports/page'
import TenantSubUsersPage from '@/app-routes/super-admin/sub-users/[tenantId]/page'

import TenantBookingsPage from '@/app-routes/tenant/bookings/page'
import TenantCalendarPage from '@/app-routes/tenant/calendar/page'
import TenantCategoriesPage from '@/app-routes/tenant/categories/page'
import TenantCustomersPage from '@/app-routes/tenant/customers/page'
import TenantInvoicesPage from '@/app-routes/tenant/invoices/page'
import TenantProductsPage from '@/app-routes/tenant/products/page'
import TenantProductSerialsPage from '@/app-routes/tenant/products/[productId]/serials/page'
import TenantTicketsPage from '@/app-routes/tenant/tickets/page'

import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterTenantPage /> },
      { path: 'verify-password-change', element: <VerifyPasswordChangePage /> },

      { path: 'shop/dashboard', element: <ShopDashboard /> },
      { path: 'shop/customers', element: <CustomersPage /> },
      { path: 'shop/customers/:id', element: <ShopCustomerDetailPage /> },
      { path: 'shop/categories', element: <ShopCategoriesPage /> },
      { path: 'shop/products', element: <ProductsPage /> },
      { path: 'shop/products/new', element: <NewProductPage /> },
      { path: 'shop/products/:id/edit', element: <EditProductPage /> },
      { path: 'shop/products/:id/units', element: <ProductUnitsPage /> },
      { path: 'shop/products/:id', element: <ProductViewPage /> },
      { path: 'shop/jobs', element: <JobsPage /> },
      { path: 'shop/jobs/new', element: <NewJobPage /> },
      { path: 'shop/jobs/:id', element: <JobDetailPage /> },
      { path: 'shop/invoices', element: <ShopInvoicesPage /> },
      { path: 'shop/invoices/new', element: <NewInvoicePage /> },
      { path: 'shop/invoices/:id', element: <InvoiceDetailPage /> },
      { path: 'shop/reports', element: <ReportsPage /> },
      { path: 'shop/support', element: <ShopSupportPage /> },
      { path: 'shop/settings', element: <ShopSettingsPage /> },
      { path: 'shop/settings/password', element: <ChangePasswordPage /> },
      { path: 'shop/my-plan', element: <MyPlanPage /> },
      { path: 'shop/inventory', element: <InventoryHubPage /> },
      { path: 'shop/inventory/calendar', element: <ShopInventoryCalendarPage /> },
      { path: 'shop/inventory/damage', element: <DamagePage /> },
      { path: 'shop/inventory/maintenance', element: <MaintenancePage /> },

      { path: 'super-admin/dashboard', element: <SuperAdminDashboard /> },
      { path: 'super-admin/shops', element: <ShopsPage /> },
      { path: 'super-admin/shops/new', element: <NewShopPage /> },
      { path: 'super-admin/shops/:id/edit', element: <EditShopPage /> },
      { path: 'super-admin/shops/:id', element: <ShopDetailPage /> },
      { path: 'super-admin/sub-users/:tenantId', element: <TenantSubUsersPage /> },
      { path: 'super-admin/subscriptions', element: <SubscriptionsPage /> },
      { path: 'super-admin/plans', element: <SubscriptionPlansPage /> },
      { path: 'super-admin/plan-requests', element: <PlanUpgradeRequestsPage /> },
      { path: 'super-admin/global-settings', element: <GlobalSettingsPage /> },
      { path: 'super-admin/support', element: <SuperAdminSupportPage /> },
      { path: 'super-admin/chat', element: <ChatPage /> },
      { path: 'super-admin/reports', element: <SuperAdminReportsPage /> },

      {
        path: 'tenant',
        element: <TenantLayout />,
        children: [
          { index: true, element: <Navigate to="/shop/dashboard" replace /> },
          { path: 'dashboard', element: <Navigate to="/shop/dashboard" replace /> },
          { path: 'bookings', element: <TenantBookingsPage /> },
          { path: 'calendar', element: <TenantCalendarPage /> },
          { path: 'categories', element: <TenantCategoriesPage /> },
          { path: 'customers', element: <TenantCustomersPage /> },
          { path: 'invoices', element: <TenantInvoicesPage /> },
          { path: 'products', element: <TenantProductsPage /> },
          { path: 'products/:productId/serials', element: <TenantProductSerialsPage /> },
          { path: 'tickets', element: <TenantTicketsPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
], {
  future: {
    v7_startTransition: true,
  },
})
