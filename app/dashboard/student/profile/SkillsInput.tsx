"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Link from "next/link";

interface Props {
  initialSkills: string[];
  maxSkills: number | null;
}

export default function SkillsInput({ initialSkills, maxSkills }: Props) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const atLimit = maxSkills !== null && skills.length >= maxSkills;

  function addSkill(raw: string) {
    const trimmed = raw.trim().replace(/,+$/, "").trim();
    if (!trimmed) return;
    if (atLimit) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setSkills((prev) => [...prev, trimmed]);
    setInputValue("");
  }

  function removeSkill(index: number) {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Comma" || e.key === ",") {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && skills.length > 0) {
      removeSkill(skills.length - 1);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // Auto-add on comma typed mid-word
    if (val.endsWith(",")) {
      addSkill(val.slice(0, -1));
    } else {
      setInputValue(val);
    }
  }

  return (
    <div>
      {/* Hidden input carries the value into the server action */}
      <input type="hidden" name="skills" value={skills.join(",")} />

      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">Kompetencer</label>
        <span
          className={`text-xs font-medium ${
            atLimit ? "text-red-500" : "text-gray-400"
          }`}
        >
          {skills.length}/{maxSkills === null ? "∞" : maxSkills}
        </span>
      </div>

      {/* Tag container — click anywhere to focus input */}
      <div
        className={`min-h-[44px] w-full border rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center cursor-text focus-within:ring-2 focus-within:ring-gray-900 transition-shadow ${
          atLimit ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"
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

      <p className="text-xs text-gray-400 mt-1.5">
        {atLimit ? (
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
