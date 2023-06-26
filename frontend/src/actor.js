import { HttpAgent, Actor } from "@dfinity/agent";

const HOST = "https://icp0.io";

const getActor = async (canisterId, idlFactory, identity) => {
  console.log('getActor called with:', { canisterId, idlFactory, identity });

  if (canisterId === undefined) {
    console.log("canisterId: ", canisterId);
    return null;
  }

  if (idlFactory === undefined) {
    console.log("idlFactory: ", idlFactory);
    return null;
  }

  if (identity === undefined) {
    console.log("identity:", identity);
  }

  const agent = new HttpAgent({
    host: HOST,
    identity: identity,
  });

  agent.fetchRootKey().catch((err) => {
    console.warn(
      "Unable to fetch root key. Check to ensure that your local replica is running"
    );
    console.error(err);
  });

  const actor = Actor.createActor(idlFactory, {
    agent: agent,
    canisterId,
  });

  return actor;
};
export { getActor };
