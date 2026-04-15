"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Link from "next/link";

const MAX_CHARS = 30;
const MAX_WORDS = 3;

interface Props {
  initialSkills: string[];
  maxSkills: number | null;
}

function validateSkill(value: string): string | null {
  if (value.length > MAX_CHARS) return `En kompetence må maks. være ${MAX_CHARS} tegn.`;
  if (value.split(/\s+/).filter(Boolean).length > MAX_WORDS) return `En kompetence må maks. bestå af ${MAX_WORDS} ord.`;
  return null;
}

export default function SkillsInput({ initialSkills, maxSkills }: Props) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const atLimit = maxSkills !== null && skills.length >= maxSkills;

  function addSkill(raw: string) {
    const trimmed = raw.trim().replace(/,+$/, "").trim();
    if (!trimmed) return;
    if (atLimit) return;

    const validationError = validateSkill(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      setError(null);
      return;
    }

    setSkills((prev) => [...prev, trimmed]);
    setInputValue("");
    setError(null);
  }

  function removeSkill(index: number) {
    setSkills((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "," ) {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // Hard-cap typing at MAX_CHARS
    if (val.length > MAX_CHARS) {
      setError(`En kompetence må maks. være ${MAX_CHARS} tegn.`);
      return;
    }
    if (val.endsWith(",")) {
      addSkill(val.slice(0, -1));
    } else {
      setInputValue(val);
      // Clear error once user edits back to valid length
      if (error && val.length <= MAX_CHARS) setError(null);
    }
  }

  return (
    <div>
      {/* Hidden input carries the value into the server action */}
      <input type="hidden" name="skills" value={skills.join(",")} />

      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">Kompetencer</label>
        <span className={`text-xs font-medium ${atLimit ? "text-red-500" : "text-gray-400"}`}>
          {skills.length}/{maxSkills === null ? "∞" : maxSkills}
        </span>
      </div>

      {/* Tag container — click anywhere to focus input */}
      <div
        className={`min-h-[44px] w-full border rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center cursor-text focus-within:ring-2 transition-shadow ${
          error
            ? "border-red-300 bg-red-50/20 focus-within:ring-red-400"
            : atLimit
            ? "border-red-200 bg-red-50/30 focus-within:ring-gray-900"
            : "border-gray-200 bg-white focus-within:ring-gray-900"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map((skill, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-gray-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
          >
            {skill}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(i);
              }}
              className="ml-0.5 hover:text-gray-300 transition-colors leading-none"
              aria-label={`Fjern ${skill}`}
            >
              ×
            </button>
          </span>
        ))}

        {!atLimit && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={skills.length === 0 ? "Skriv en kompetence og tryk Enter…" : "Tilføj flere…"}
            className="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder-gray-400"
          />
        )}
      </div>

      <p className={`text-xs mt-1.5 ${error ? "text-red-500" : "text-gray-400"}`}>
        {error ? (
          error
        ) : atLimit ? (
          <>
            Du har nået din grænse på {maxSkills} kompetencer.{" "}
            <Link href="/dashboard/student/package" className="underline hover:text-gray-600">
              Opgrader for ubegrænset adgang.
            </Link>
          </>
        ) : (
          "Tryk Enter eller komma for at tilføje en kompetence."
        )}
      </p>
    </div>
  );
}
