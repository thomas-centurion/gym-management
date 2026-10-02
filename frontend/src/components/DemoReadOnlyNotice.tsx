import { isDemoMode } from "../config/demo";

const DemoReadOnlyNotice = () => isDemoMode ? (
  <p role="status" className="inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-medium leading-4 text-slate-600">
    DEMO · Solo lectura
  </p>
) : null;

export default DemoReadOnlyNotice;
