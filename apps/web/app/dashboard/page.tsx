'use client';
import Checkbox from '@components/Checkbox';
import MultiSelectCard from '@components/MultiSelectCard';
import RadioCard, { RadioItem } from '@components/RadioCard';
import UserCard from '@components/UserCard';
import Wizard, { WizardStep } from '@components/Wizard';
import { useDashboardContext } from '@lib/context/dashboardContext';

function Dashboard() {
  const { user } = useDashboardContext();
  return (
    <>
      <UserCard />

      <Wizard onSubmit={() => {}}>
        <WizardStep title="Multi-select step">
          <MultiSelectCard>
            {['role1', 'role2', 'role3'].map((role) => {
              return (
                <Checkbox id={role} key={role}>
                  {role}
                </Checkbox>
              );
            })}
          </MultiSelectCard>
        </WizardStep>

        <WizardStep title="Radio card step">
          <RadioCard>
            {Array(5)
              .fill(0)
              .map((_, index) => {
                return (
                  <RadioItem
                    key={index}
                    id={index.toString()}
                    label={`option${index}`}
                    value={`${index}`}
                  />
                );
              })}
          </RadioCard>
        </WizardStep>
      </Wizard>
    </>
  );
}

export default Dashboard;
