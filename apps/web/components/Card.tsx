import classes from '@styles/Card.module.css';

interface CardProps {
  title: string;
  children?: React.ReactNode;
}

// TODO: card link

function Card({ title, children }: CardProps) {
  return <div className={classes.root}>{children}</div>;
}

export default Card;
