import classes from '@styles/ControlGroup.module.css';

interface ControlGroupProps {
  children: React.ReactNode[];
}

function ControlGroup({ children }: ControlGroupProps) {
  return <div className={classes.root}>{children}</div>;
}

export default ControlGroup;
