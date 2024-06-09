# Wireless Light Alarm Clock Mobile App

## Description

This is a mobile app (iOS + Android) developed using React-Native that has a full featured alarm clock that is fully customizable and configurable with wireless lights (only 'Govee' brand. Future optimization to include APIs for other brands). 

## Download: 

- Deployed on the App Store: [http://3.131.168.18:8050/](https://apps.apple.com/ca/app/wifi-light-alarm/id6503112602?platform=iphone)
- Deploying on the Play Store (waiting for verification and testing). 

## Demo Video:

https://www.youtube.com/watch?v=CviftibvQpY

## Features:

- Alarm:
     - Can configure any lights that are supported on the Govee API to an alarm clock.
     - Each device can be configured differently for the same alarm (on/Off, brightness, color, label).
     - Sound can be selected from local audio files or using preloaded sound files.
     - Snooze can be enabled/disables, snooze duration can be set and device action can also be set when snoozing alarm (on/off lights, do nothing).

- Home Page:
     - Alarms can be grouped/ungrouped (whether they only ON devices, only OFF devices, hybrid of ON/OFF, or no devices).
     - Hide or show alarm details (label, alarm grouping/# of devices, snooze or sound settings). 
     - Can enable/disable or delete from home page (can also delete from within alarm).
     - Can sort by ascending/descending time. 

- Troubleshooting:
     - If at any point the API key, GET url, or POST url become outdated, you can override them in 'Settings --> Troubleshooting' with newer values (all credentials are encrypted before saving to local storage).
     - Can reset overrides using 'Override' button. 

