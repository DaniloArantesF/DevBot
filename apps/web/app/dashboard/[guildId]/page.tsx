'use client';
import { useDashboardContext } from '@lib/context/dashboardContext';
import { useEffect, useMemo } from 'react';
import RadioCard, { RadioItem } from '@components/ui/RadioCard';
import Wizard, { WizardStep } from '@components/ui/Wizard';
import ChannelCreationDialog from '@components/features/ChannelCreationDialog';
import MaintenancePanel from '@components/features/MaintenancePanel';

export default function Page({
  params,
  searchParams,
}: {
  params: { guildId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { user, currentGuild, setCurrentGuild, guilds } = useDashboardContext();
  const guild = useMemo(() => guilds.find((g) => g.id === currentGuild), [currentGuild, guilds]);

  useEffect(() => {
    setCurrentGuild(params.guildId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div>
        <h1>{guild?.name}</h1>
        <span></span>
      </div>

      <MaintenancePanel />

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
