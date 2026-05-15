"use client";

type LevelSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function LevelSlider({ value, onChange }: LevelSliderProps) {
  return (
    <div className="flex w-full flex-col items-center py-4">
      <span
        className="select-none text-[60px] font-semibold leading-none text-[#A8C5DA] tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <label htmlFor="level-slider" className="sr-only">
        Anspannungslevel von 0 bis 10
      </label>
      <input
        id="level-slider"
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="level-slider mt-6 w-full max-w-[320px]"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={`Level ${value}`}
      />

      <div className="mt-3 flex w-full max-w-[320px] justify-between text-xs text-text-secondary">
        <span>0</span>
        <span>10</span>
      </div>
    </div>
  );
}
