import { MyDataPart } from "@/lib/message-type";
import {
  InferToolInput,
  InferToolOutput,
  tool,
  UIMessage,
  UIMessageStreamWriter,
} from "ai";
import z from "zod/v4";

export const getWeatherInformation = (
  writer: UIMessageStreamWriter<UIMessage<never, MyDataPart>>
) =>
  tool({
    description: "show the weather in a given city to the user",
    inputSchema: z.object({ city: z.string() }),
    execute: async ({ city }, { toolCallId: id }) => {
      // dummy data stream writer to show the weather in a given city to the user
      // write initial message part
      writer.write({
        type: "data-weather",
        data: { location: city, weather: undefined, loading: true },
        id,
      });
      // writer is the object that writes the message parts to the stream

      // Add artificial delay of 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const weatherOptions = ["sunny", "cloudy", "rainy", "snowy", "windy"];

      const weather =
        weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

      // add weather value with same id
      writer.write({
        type: "data-weather",
        data: { weather, loading: true },
        id,
      });

      // add another artificial delay of 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate random temperature between -10 and 40 degrees Celsius
      const temperature = Math.floor(Math.random() * 51) - 10;

      // write temperature value with same id
      writer.write({
        type: "data-weather",
        data: { temperature, loading: false },
        id,
      });

      return { city, weather };
    },
  });

// types used in our db schema
export type getWeatherInformationInput = InferToolInput<
  ReturnType<typeof getWeatherInformation>
>;
export type getWeatherInformationOutput = InferToolOutput<
  ReturnType<typeof getWeatherInformation>
>;

export const tools = (writer: UIMessageStreamWriter) => ({
  getWeatherInformation: getWeatherInformation(writer), // pipe in stream writer
});
