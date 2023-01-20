import classes from '@styles/Widget.module.css';
import Separator from './Separator';

type WidgetProps = React.ComponentProps<'div'> & {
  title: string;
  children: React.ReactNode;
  rows?: number;
  cols?: number;
};

function Widget({ title, children, rows = 1, cols = 1, style, ...props }: WidgetProps) {
  return (
    <div
      {...props}
      style={{ gridRow: `span ${rows}`, gridColumn: `span ${cols}`, ...style }}
      className={`${classes.container} ${props.className}`}
    >
      <p className={classes.header}>{title}</p>
      <Separator />
      <div className={classes.body}>{children}</div>
    </div>
  );
}

export default Widget;
