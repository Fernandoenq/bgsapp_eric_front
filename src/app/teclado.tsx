import React from "react";

interface VirtualKeyboardProps<T> {
  targetInput: keyof T | null; // Nome do campo ativo
  onInputChange: (field: keyof T, updateValue: (prevValue: string) => string) => void; // Função de atualização
}

export const VirtualKeyboard = <T,>({
  targetInput,
  onInputChange,
}: VirtualKeyboardProps<T>) => {
  const handleKeyPress = (key: string) => {
    if (!targetInput) return;

    // Se o campo ativo for "whatsapp", permita apenas números ou DEL
    if (targetInput === "whatsapp" && key !== "APAGAR" && !/^\d$/.test(key)) {
      return; // Impede a entrada de caracteres não numéricos
    }

    onInputChange(targetInput, (prevValue) =>
      key === "APAGAR" ? prevValue.slice(0, -1) : prevValue + key
    );
  };

  const rows: string[][] = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M", "APAGAR"],
  ];

  return (
    <div className="virtual-keyboard">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="key-row">
          {row.map((key, index) => (
            <button
              key={index}
              className="key"
              onClick={() => handleKeyPress(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <style jsx>{`
        .virtual-keyboard {
          display: flex;
          flex-direction: column;
          align-items: stretch; /* Garante que as linhas ocupem 100% do pai */
          justify-content: space-between;
          height: 90%; /* Adapta ao tamanho do contêiner pai */
          width: 100%; /* Adapta ao tamanho do contêiner pai */
          margin-bottom: 80px;
          margin-top: 80px;
        }
        .key-row {
          display: flex;
          justify-content: space-between; /* Espaçamento uniforme entre as teclas */
          margin: 5px 0;
          flex: 1; /* Faz com que todas as linhas tenham a mesma altura */
        }
        .key {
          flex: 1; /* Faz com que cada tecla ocupe o mesmo espaço dentro da linha */
          margin: 2px;
          padding: 10px 0;
          font-size: 1vw; /* Responsivo ao tamanho do contêiner */
          border: none;
          border-radius: 5px;
          background-color: #444;
          color: white;
          cursor: pointer;
          transition: 0.2s ease;
          text-align: center;
        }
        .key:hover {
          background-color: #555;
        }
        .key:active {
          background-color: #666;
        }
      `}</style>
    </div>
  );
};
