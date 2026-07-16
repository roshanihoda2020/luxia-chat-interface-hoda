import svgPaths from "./svg-9gs1javwwb";
import imgRectangle2 from "./12e1f94e22fb50fbf23757ec6f22962cfae2999b.png";
import { imgRectangle, imgRectangle1 } from "./svg-0fwr7";

function Group1() {
  return (
    <div className="absolute contents inset-[0.06%_1.62%_31.2%_77.01%]" data-name="Group">
      <div className="absolute inset-[0.06%_1.62%_31.2%_77.01%] mask-position-[0.012px_0px,_0px_0px]" style={{ maskImage: `url("${imgRectangle}"), url("${imgRectangle1}")` }} data-name="Rectangle">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgRectangle2} />
        </div>
      </div>
    </div>
  );
}

function ClipPathGroup1() {
  return (
    <div className="absolute contents inset-[0.06%_1.62%_31.2%_77.01%]" data-name="Clip path group">
      <Group1 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents inset-[0.06%_1.62%_31.2%_77.01%]" data-name="Group">
      <ClipPathGroup1 />
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="absolute contents inset-[0.06%_1.81%_31.63%_77.02%]" data-name="Clip path group">
      <Group />
    </div>
  );
}

export default function LogoNegativo() {
  return (
    <div className="relative size-full" data-name="Logo negativo">
      <ClipPathGroup />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[18px] left-[calc(50%+28.83px)] top-[calc(50%+14.1px)] w-[22px]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22 18">
          <path clipRule="evenodd" d={svgPaths.p34c86000} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[19px] left-[calc(50%+10.83px)] top-[calc(50%+13.6px)] w-[6px]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 19">
          <path d="M6 0H0V19H6V0Z" fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[18px] left-[calc(50%-6.17px)] top-[calc(50%+14.1px)] w-[20px]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 18">
          <path d={svgPaths.p35ff380} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[18px] left-[calc(50%-30.67px)] top-[calc(50%+14.1px)] w-[19px]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
          <path d={svgPaths.p37a09a00} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[18px] left-[calc(50%-50.17px)] top-[calc(50%+14.1px)] w-[16px]" data-name="Vector">
        <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
          <path d={svgPaths.p33532000} fill="var(--fill-0, white)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}