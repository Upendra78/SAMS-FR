function AdminLayout({ children }) {
  return (
    <div>
      <header>Admin Portal</header>
      <main>{children}</main>
    </div>
  );
}

export default AdminLayout;