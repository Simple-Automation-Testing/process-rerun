function getPollTime(timeVal: any): number {
  return typeof timeVal === 'number' && !Number.isNaN(timeVal) && Number.isFinite(timeVal) ? timeVal : 1000;
}

function sleep(time: number): Promise<void> {
  return new Promise(res => setTimeout(res, time));
}

export { getPollTime, sleep };
