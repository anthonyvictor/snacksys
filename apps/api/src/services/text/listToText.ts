import { IChatList } from "types";
import { join } from "./join";
import { textStyles } from "./styles";

export const listToText = ({ items, title, description }: IChatList) => {
  const { bold, italic, section } = textStyles;
  const header = join([section(title), italic(description)], "\n"); //bold(title),
  return join(
    [
      join(
        [
          header,
          join(
            items.map((item, i) => `- ${join(item.body, "\n")}`),
            items.some((item) => item.body.length > 1) ? "\n\n" : "\n"
          ),
        ],
        "\n\n"
      ),
    ],
    "\n"
  );
};
