import React from "react";
import { Composition } from "remotion";
import { FPS, Stage, totalFrames } from "./core";
import { V1 } from "./v1";
import { V2 } from "./v2";
import { V3 } from "./v3";

const DEFS: Record<string, any> = { Video1: V1, Video2: V2, Video3: V3 };
const Comp = (props: { id: string }) => <Stage id={props.id} defs={DEFS[props.id]} />;
export const Root: React.FC = () => (
  <>{Object.keys(DEFS).map((id) => (
    <Composition key={id} id={id} component={Comp as any} durationInFrames={totalFrames(id)} fps={FPS} width={1920} height={1080} defaultProps={{ id } as any} />
  ))}</>
);
