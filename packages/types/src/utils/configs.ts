import { IConfig } from "../config";

export const isNowWorking = (configs: IConfig[]) => {
  const cfgworkingHours = configs.find((x) => x.key === "workingHours")?.value;

  if (!cfgworkingHours)
    throw new Error("Configurações de horário de funcionamento inválidas!");

  const { daysOfWeek, openExceptions, closeExceptions } = cfgworkingHours;

  const now = new Date();
  const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const compareTime = (
    startTime: [number, number],
    endTime: [number, number]
  ) => {
    const [startHour, startMinute] = startTime;
    const [endHour, endMinute] = endTime;

    if (startHour < hours || (startHour === hours && startMinute <= minutes)) {
      if (endHour > hours || (endHour === hours && endMinute >= minutes)) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const isDayAndHour = daysOfWeek.some(
    (d: any) =>
      d.day === day &&
      compareTime(d.start.split(":").map(Number), d.end.split(":").map(Number))
  );

  const isOpenException = openExceptions.some(
    (x: { start: Date; end: Date }) => {
      if (!x.start || !x.end) return false;
      const openDateStart = new Date(x.start);
      const openDateEnd = new Date(x.end);

      return now >= openDateStart && now < openDateEnd;
    }
  );
  const isCloseException = closeExceptions.some(
    (x: { start: Date; end: Date }) => {
      if (!x.start || !x.end) return false;
      const closeDateStart = new Date(x.start);
      const closeDateEnd = new Date(x.end);

      return now >= closeDateStart && now < closeDateEnd;
    }
  );
  if (isCloseException) return false;

  return isDayAndHour || isOpenException;
};
