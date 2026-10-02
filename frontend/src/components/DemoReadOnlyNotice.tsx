import { isDemoMode } from "../config/demo";

const DemoReadOnlyNotice = () => isDemoMode ? (
  <p role="status" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
    DEMO · Solo lectura
  </p>
) : null;

export default DemoReadOnlyNotice;
