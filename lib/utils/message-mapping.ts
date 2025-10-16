import { MyUIMessagePart } from "../message-type";
import { MyDBUIMessagePart, MyDBUIMessagePartSelect } from "@/lib/db/schema";

// this file is the bridge between the app-level objects (AI SDK message parts) and the DB schema (prefix-columns like text_text, data_weather_temperature).

export const mapUIMessagePartsToDBParts = (
  messageParts: MyUIMessagePart[],
  messageId: string
): MyDBUIMessagePart[] => {
  return messageParts.map((part, index) => {
    switch (part.type) {
      case "text":
        return {
          messageId,
          order: index,
          type: part.type,
          text_text: part.text,
        };
      case "reasoning":
        return {
          messageId,
          order: index,
          type: part.type,
          reasoning_text: part.text,
          providerMetadata: part.providerMetadata,
        };
      // removed unsupported part types: file, source-document, source-url
      case "step-start":
        return {
          messageId,
          order: index,
          type: part.type,
        };
      case "tool-getWeatherInformation":
        return {
          messageId,
          order: index,
          type: part.type,
          tool_toolCallId: part.toolCallId,
          tool_state: part.state,
          tool_getWeatherInformation_input:
            part.state === "input-available" ||
            part.state === "output-available" ||
            part.state === "output-error"
              ? part.input
              : undefined,
          tool_getWeatherInformation_output:
            part.state === "output-available" ? part.output : undefined,
          tool_getWeatherInformation_errorText:
            part.state === "output-error" ? part.errorText : undefined,
        };
      // removed unsupported tool: tool-getLocation
      case "data-weather":
        return {
          messageId,
          order: index,
          type: part.type,
          data_weather_id: part.id,
          data_weather_location: part.data.location,
          data_weather_weather: part.data.weather,
          data_weather_temperature: part.data.temperature,
          // no need to persist loading variable -> set to false in mapping below
        };
      default:
        throw new Error(`Unsupported part type: ${part}`);
    }
  });
};

export const mapDBPartToUIMessagePart = (
  part: MyDBUIMessagePartSelect
): MyUIMessagePart => {
  switch (part.type) {
    case "text":
      return {
        type: part.type,
        text: part.text_text!,
      };
    case "reasoning":
      return {
        type: part.type,
        text: part.reasoning_text!,
        providerMetadata: part.providerMetadata ?? undefined,
      };
    // removed unsupported part types: file, source-document, source-url
    case "step-start":
      return {
        type: part.type,
      };
    case "tool-getWeatherInformation":
      if (!part.tool_state) {
        throw new Error("getWeatherInformation_state is undefined");
      }
      switch (part.tool_state) {
        case "input-streaming":
          return {
            type: "tool-getWeatherInformation",
            state: "input-streaming",
            toolCallId: part.tool_toolCallId!,
            input: part.tool_getWeatherInformation_input!,
          };
        case "input-available":
          return {
            type: "tool-getWeatherInformation",
            state: "input-available",
            toolCallId: part.tool_toolCallId!,
            input: part.tool_getWeatherInformation_input!,
          };
        case "output-available":
          return {
            type: "tool-getWeatherInformation",
            state: "output-available",
            toolCallId: part.tool_toolCallId!,
            input: part.tool_getWeatherInformation_input!,
            output: part.tool_getWeatherInformation_output!,
          };
        case "output-error":
          return {
            type: "tool-getWeatherInformation",
            state: "output-error",
            toolCallId: part.tool_toolCallId!,
            input: part.tool_getWeatherInformation_input!,
            errorText: part.tool_errorText!,
          };
      }
    case "data-weather":
      return {
        type: "data-weather",
        data: {
          loading: false,
          location: part.data_weather_location!,
          weather: part.data_weather_weather!,
          temperature: part.data_weather_temperature!,
        },
        id: part.data_weather_id!,
      };
    default:
      throw new Error(`Unsupported part type: ${part.type}`);
  }
};
