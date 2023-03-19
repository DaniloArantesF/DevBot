'use client';
import RadioCard, { RadioItem } from '@components/RadioCard';
import UserCard from '@components/UserCard';
import Wizard, { WizardStep } from '@components/Wizard';
import ChannelCreationDialog from '@components/features/ChannelCreationDialog';
import { useDashboardContext } from '@lib/context/dashboardContext';

function Dashboard() {
  const { user } = useDashboardContext();
  return (
    <>
      <UserCard />

      <Wizard onSubmit={() => console.log('Submit!')}>
        <WizardStep title="Configure bot channels">
          <ChannelCreationDialog />
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

        <WizardStep title="Channel Selection">
          <RadioCard>
            {Array(10)
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
