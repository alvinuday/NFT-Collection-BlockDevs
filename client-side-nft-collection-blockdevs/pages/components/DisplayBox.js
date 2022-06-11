import Image from "next/image";
import imageurl from "../../public/exclamation.png";
export default function textBox(props) {
  if (!props.show) {
    return null;
  }
  return (
    <div>
      <div class="p-6 max-w-sm bg-white rounded-xl shadow-lg flex items-center space-x-4 hover:shadow-md">
        <div class="shrink-0">
          <Image
            layout="intrinsic"
            src={imageurl}
            width={50}
            height={50}
            // loader={myLoader}
          ></Image>
        </div>
        <div>
          <div class="text-lg font-medium text-black">
            Check your NFT out here
          </div>
          <a
            className=""
            target="_blank"
            rel="noopener noreferrer"
            href={`https://testnets.opensea.io/assets/rinkeby/0x968f65eb30d01439a969074252ce6c3b423f9362/${props.link}`}
          >
            <p class="text-slate-500 hover:text-black cursor-pointer">
              Block Dev#{props.link}
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
