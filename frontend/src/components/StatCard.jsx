function StatCard({ title, value, description }) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{value}</p>
      {description && <small>{description}</small>}
    </article>
  );
}

export default StatCard;