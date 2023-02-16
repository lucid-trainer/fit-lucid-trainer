function SettingsConfig(props) {
    return (
      <Page>
          <Section
              description={<Text> Description here</Text>}
              title={<Text bold align="center">Demo Settings</Text>}>
              <Text>
                  Set the vibration type and duration
              </Text>
              <Select
                label={`Haptic`}
                settingsKey="hapticSetting"
                options={[
                  {name:"alert", value:"alert"},
                  {name:"bump",  value:"bump"},
                  {name:"confirmation", value:"confirmation"},
                  {name:"confirmation-max", value:"confirmation-max"},
                  {name:"nudge", value:"nudge"},
                  {name:"nudge-max", value:"nudge-max"},
                ]}
              />
              <Select
                label={`Duration (seconds/repetitions)`}
                settingsKey="durationSetting"
                options={[
                  {name:"2",  value:"2"},
                  {name:"3",  value:"3"},
                  {name:"4",  value:"4"},
                  {name:"5",  value:"5"},
                  {name:"6",  value:"6"},
                  {name:"7",  value:"7"},
                  {name:"8",  value:"8"},
                  {name:"9",  value:"9"},
                ]}
              />    
          </Section>
      </Page>
    );
  }
  
  registerSettingsPage(SettingsConfig);