import { Composition, Still } from "remotion";
import { KolamTetris, timeline } from "./KolamTetris";
import { OgCard } from "./OgCard";
import { WeaveDiagram } from "./WeaveDiagram";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KolamTetris"
        component={KolamTetris}
        durationInFrames={timeline.totalFrames}
        fps={60}
        width={1080}
        height={1920}
      />
      <Still id="WeaveDiagram" component={WeaveDiagram} width={3200} height={1800} />
      <Still id="OgCard" component={OgCard} width={2400} height={1260} />
    </>
  );
};
