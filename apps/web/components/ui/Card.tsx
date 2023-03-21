import classes from '@styles/Card.module.css';

interface CardProps {
  children?: React.ReactNode;
  title: string;
}

// TODO: card link

function Card({ title, children }: CardProps) {
  return <div className={classes.root}>{children}</div>;
}

export default Card;
