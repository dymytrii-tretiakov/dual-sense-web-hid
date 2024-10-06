import { useEffect, useRef, useState } from 'react';
import { isEqual } from 'lodash';

type Stick = {
  x: number;
  y: number;
};

type Buttons = {
  dPad: number;
  square: boolean;
  cross: boolean;
  circle: boolean;
  triangle: boolean;
  l1: boolean;
  l2: boolean;
  l3: boolean;
  r1: boolean;
  r2: boolean;
  r3: boolean;
  options: boolean;
  share: boolean;
  lStick: Stick;
  rStick: Stick;
  lTrigger: number;
  rTrigger: number;
};

function usePS5() {
  const [device, setDevice] = useState<HIDDevice | null>(null);
  const [buttons, setButtons] = useState<Buttons>({
    dPad: 8,
    square: false,
    cross: false,
    circle: false,
    triangle: false,
    l1: false,
    l2: false,
    l3: false,
    r1: false,
    r2: false,
    r3: false,
    options: false,
    share: false,
    lStick: { x: 50, y: 50 },
    rStick: { x: 50, y: 50 },
    lTrigger: 0,
    rTrigger: 0
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

  const transformStickValue = (x: number, y: number) => {
    const transformedX = Math.round(((x + 128) / 256) * 100);
    const transformedY = Math.round(((y + 128) / 256) * 100);

    return { x: transformedX, y: transformedY };
  };

  const transformTriggerValue = (value: number) => {
    return Math.round((value / 255) * 100);
  };

  useEffect(() => {
    if (device) {
      const handleInputReport = (event: HIDInputReportEvent) => {
        const { data } = event;

        const dPadValues = data.getUint8(7) & 0x0f;
        const buttonsBits = data.getUint8(7) & 0xf0;
        const otherBits = data.getUint8(8);
        const leftStickXBits = data.getUint8(0);
        const leftStickYBits = data.getUint8(1);
        const rightStickXBits = data.getUint8(2);
        const rightStickYBits = data.getUint8(3);
        const lTriggerBits = data.getUint8(4);
        const rTriggerBits = data.getUint8(5);

        const leftStick = transformStickValue(leftStickXBits, leftStickYBits);
        const rightStick = transformStickValue(rightStickXBits, rightStickYBits);

        const lTrigger = transformTriggerValue(lTriggerBits);
        const rTrigger = transformTriggerValue(rTriggerBits);

        const newButtons = {
          dPad: dPadValues,
          square: (buttonsBits & 0x10) !== 0,
          cross: (buttonsBits & 0x20) !== 0,
          circle: (buttonsBits & 0x40) !== 0,
          triangle: (buttonsBits & 0x80) !== 0,
          l1: (otherBits & 0x01) !== 0,
          l2: (otherBits & 0x04) !== 0,
          l3: (otherBits & 0x40) !== 0,
          r1: (otherBits & 0x02) !== 0,
          r2: (otherBits & 0x08) !== 0,
          r3: (otherBits & 0x80) !== 0,
          options: (otherBits & 0x20) !== 0,
          share: (otherBits & 0x10) !== 0,
          lStick: leftStick,
          rStick: rightStick,
          lTrigger,
          rTrigger
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
