import { Composition, Still } from "remotion";
import { KolamTetris, timeline } from "./KolamTetris";
import { OgCard } from "./OgCard";
import { WeaveDiagram } from "./WeaveDiagram";
import { DURATION } from "./share/beats";
import { ShareStory } from "./share/ShareStory";

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
      <Composition
        id="ShareStory"
        component={ShareStory}
        durationInFrames={DURATION}
        fps={60}
        width={1080}
        height={1920}
      />
      <Still id="WeaveDiagram" component={WeaveDiagram} width={3200} height={1800} />
      <Still id="OgCard" component={OgCard} width={2400} height={1260} />
    </>
  );
};
