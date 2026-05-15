"use client";

type MiniLevelSliderProps = {
  value: number;
  onChange: (value: number) => void;
  id?: string;
};

export function MiniLevelSlider({ value, onChange, id = "level-after-slider" }: MiniLevelSliderProps) {
  return (
    <div className="flex w-full flex-col items-center py-2">
      <span className="select-none text-4xl font-semibold tabular-nums text-[#A8C5DA]">
        {value}
      </span>
      <label htmlFor={id} className="sr-only">
        Anspannungslevel nach dem Skill von 0 bis 10
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="level-slider mt-4 w-full max-w-[280px]"
        aria-valuenow={value}
      />
      <div className="mt-2 flex w-full max-w-[280px] justify-between text-xs text-text-secondary">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
}
