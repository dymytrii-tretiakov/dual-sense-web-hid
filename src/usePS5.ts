import { useEffect, useRef, useState } from 'react';
import { isEqual } from 'lodash';

type Buttons = {
  x: boolean;
  circle: boolean;
  triangle: boolean;
  square: boolean;
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

const CROSS = 0b00100000;
const CIRCLE = 0b01000000;
const TRIANGLE = 0b10000000;
const SQUARE = 0b00010000;

const LEFT = 0b00000110;
const RIGHT = 0b00000010;
const TOP = 0b00000000;
const BOTTOM = 0b00000100;

function usePS5() {
  const [device, setDevice] = useState<HIDDevice | null>(null);
  const [buttons, setButtons] = useState<Buttons>({
    x: false,
    circle: false,
    triangle: false,
    square: false,
    top: false,
    bottom: false,
    left: false,
    right: false
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
      console.log('Device connected:', device);

      const handleInputReport = (event: HIDInputReportEvent) => {
        const { data } = event;

        const values = new Int8Array(data.buffer);
        const buttons = values[7];

        // console.log('Buttons:', buttons.toString(2));

        const newButtons = {
          x: (buttons & CROSS) === CROSS,
          circle: (buttons & CIRCLE) === CIRCLE,
          triangle: (buttons & TRIANGLE) === TRIANGLE,
          square: (buttons & SQUARE) === SQUARE,
          top: (buttons & TOP) === TOP,
          bottom: (buttons & BOTTOM) === BOTTOM,
          left: (buttons & LEFT) === LEFT,
          right: (buttons & RIGHT) === RIGHT
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
