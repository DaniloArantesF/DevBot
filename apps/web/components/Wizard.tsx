import React from 'react';
import { useState } from 'react';
import Widget from './Widget';
import Button from './Button';
import classes from '@styles/Wizard.module.css';

interface WizardProps {
  children: React.ReactElement[]; //| React.ReactElement;
  onSubmit: () => void;
}

interface StepProps {
  title: string;
  children: React.ReactNode;
}

export const WizardStep: React.FC<StepProps> = ({ title, children }) => {
  return (
    <div>
      <h3>{title}</h3>
      <div style={{ paddingTop: '1rem' }}>{children}</div>
    </div>
  );
};

function Wizard({ children, onSubmit }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < children.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <Widget title={'Guild Config Wizard'}>
      <div className={classes.body}>{children[currentStep]}</div>
      <div className={classes.controls}>
        {currentStep > 0 && <Button label={'Back'} onClick={back} variant="slim" />}
        {currentStep < children.length - 1 && (
          <Button label={'Next'} onClick={next} variant="slim" />
        )}
        {currentStep === children.length - 1 && (
          <Button label={'Submit'} onClick={handleSubmit} variant="slim" />
        )}
      </div>
    </Widget>
  );
}

export default Wizard;
