import { useEffect, useRef, useState } from 'react';
import { isEqual } from 'lodash';

type Buttons = {
  dPad: number;
  square: boolean;
  cross: boolean;
  circle: boolean;
  triangle: boolean;
};

function usePS5() {
  const [device, setDevice] = useState<HIDDevice | null>(null);
  const [buttons, setButtons] = useState<Buttons>({
    dPad: 8,
    square: false,
    cross: false,
    circle: false,
    triangle: false
  });
  const prevButtonsRef = useRef<Buttons>(buttons);

  const requestHIDDevice = async () => {
    try {
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 0x054c }]
      });

      if (devices.length > 0) {
        const selectedDevice = devices[0];
        setDevice(selectedDevice);
        await selectedDevice.open();
      } else {
        console.log('No device selected');
      }
    } catch (error) {
      console.error('Error requesting device:', error);
    }
  };

  useEffect(() => {
    if (device) {
      const handleInputReport = (event: HIDInputReportEvent) => {
        const { data } = event;

        const dPadValues = data.getUint8(7) & 0x0f;
        const buttonsBits = data.getUint8(7) & 0xf0;

        const newButtons = {
          dPad: dPadValues,
          square: (buttonsBits & 0x10) !== 0,
          cross: (buttonsBits & 0x20) !== 0,
          circle: (buttonsBits & 0x40) !== 0,
          triangle: (buttonsBits & 0x80) !== 0
        };

        if (!isEqual(newButtons, prevButtonsRef.current)) {
          setButtons(newButtons);
          prevButtonsRef.current = newButtons;
        }
      };

      device.addEventListener('inputreport', handleInputReport);

      return () => {
        device.removeEventListener('inputreport', handleInputReport);
      };
    }
  }, [device]);

  return { device, requestHIDDevice, buttons };
}

export default usePS5;
