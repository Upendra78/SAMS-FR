function StudentLayout({ children }) {
  return (
    <div>
      <header>Student Portal</header>
      <main>{children}</main>
    </div>
  );
}

export default StudentLayout;