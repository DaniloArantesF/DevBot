import { forwardRef } from 'react';
import classes from '@styles/MultiSelectCard.module.css';

interface MultiSelectCardProps {
  children?: React.ReactNode[];
  title?: string;
}

const MultiSelectCard = forwardRef<HTMLDivElement, MultiSelectCardProps>(
  ({ title, children }, forwardedRef) => {
    return (
      <div ref={forwardedRef}>
        {title && <label>{title}</label>}
        <div className={classes.body}>{children}</div>
      </div>
    );
  },
);

MultiSelectCard.displayName = 'MultiSelectCard';
export default MultiSelectCard;
