"use client";

import { useId, useMemo, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type SuggestionSelectProps = {
  name: string;
  options: Option[];
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function SuggestionSelect({
  name,
  options,
  placeholder,
  defaultValue = "",
  required = false,
  disabled = false,
  className,
}: SuggestionSelectProps) {
  const listId = useId();

  const labelByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option.label])),
    [options]
  );

  const valueByLabel = useMemo(
    () => new Map(options.map((option) => [option.label.toLowerCase(), option.value])),
    [options]
  );

  const [inputValue, setInputValue] = useState(labelByValue.get(defaultValue) ?? "");
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  function syncValue(nextInput: string) {
    const normalized = nextInput.trim().toLowerCase();
    const matchedValue =
      valueByLabel.get(normalized) ??
      options.find((option) => option.value.toLowerCase() === normalized)?.value ??
      "";

    setInputValue(nextInput);
    setSelectedValue(matchedValue);
  }

  return (
    <>
      <input
        list={listId}
        value={inputValue}
        onChange={(event) => syncValue(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
      />
      <input type="hidden" name={name} value={selectedValue} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </>
  );
}
