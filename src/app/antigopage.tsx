"use client"
import React, { useEffect, useRef, useState } from "react";
import { Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Card, CardFooter, Tabs, Tab, Select, SelectItem, Chip, CardHeader, CardBody, Input, Spinner, Progress } from "@nextui-org/react";
import { extname } from "path";
import { GalleryIcon } from "./GalleryIcon";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client";
import { BiSolidChevronsDown } from 'react-icons/bi';

type ThemesType = {
  images: string;
  description: string;
  value: string;
}

type UserType = {
  username: string;
  whatsapp: string;
  image: any;
  genero: 'masculino' | 'feminino' | 'outro';
} & {
  [key: string]: any; // Permite propriedades dinâmicas
};

type GeneratedImagesType = {
  main: string;
  variations: string[];
  buttonMessageId: string;
  reference: string;
}

type AuthType = {
  password: string
}

type GalleryType = {
  nome: string,
  caminho: string,
  image: string
}

export default function Home() {

  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onOpenChange: onAuthOpenChange, onClose: onAuthClose } = useDisclosure();


  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: is2Open, onOpen: on2Open, onOpenChange: on2OpenChange, onClose: on2Close } = useDisclosure();
  const { isOpen: isGalleryOpen, onOpen: onGalleryOpen, onOpenChange: onGalleryOpenChange, onClose: onGalleryClose } = useDisclosure();

  const [userData, setUserData] = useState<UserType>({} as UserType);
  const [authData, setAuthData] = useState<AuthType>({} as AuthType);

  const [printingImg, setPrintingImg] = useState<{ state: boolean, image: string }>({ state: false, image: '' });
  const [genProgress, setGenProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImagesType>({} as GeneratedImagesType);
  const [selectGeneratedImage, setSelectGeneratedImage] = useState<any>(undefined);

  const [socketio, setSocketIo] = useState<Socket>();
  const [socketState, setSocketState] = useState<'connceted' | 'disconnected'>('disconnected');
  const [imageURL, setImageURL] = useState<any>('https://media.discordapp.net/attachments/1298032353234653234/1298038016215879700/eric.viinny_apenas_recrie_a_imagem_em_formato_de_cartoon_4k_ult_a853bb8e-9ccc-4d02-ae90-9daf801fa57a.png?ex=65193544&is=6517e3c4&hm=988d2f3dc418f6bb93317403376a7bb4f5bd9073170108cfe0203f4a1e4efa8a&=&width=662&height=662');

  const [galleryImages, setGalleryImages] = useState<GalleryType[]>([] as GalleryType[]);

  const [CognaThemes, setCognaThemes] = useState<ThemesType[]>([] as ThemesType[]);
  //const [cosplayThemes, setCosplayThemes] = useState<ThemesType[]>([] as ThemesType[]);
  //const [noCosplayThemes, setNoCosplayThemes] = useState<ThemesType[]>([] as ThemesType[]);
  //const [gamesThemes, setGamesThemes] = useState<ThemesType[]>([] as ThemesType[]);

  const [selectedTheme, setSelectedTheme] = useState<ThemesType>({} as ThemesType);

  const [activeField, setActiveField] = useState<string | null>(null);

  

  const [inputs, setInputs] = useState<InputsType>({
    nome: '',
    telefone: ''
  });

  const handleInputChange = (field: keyof UserType, updateValue: (prevValue: string) => string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: updateValue(prev[field] || ""),
    }));
  };
  

  async function selectTheme(theme: ThemesType) {
    setSelectedTheme(theme);
  }

  async function handleSelectGeneratedImage(variation: string) {
    setSelectGeneratedImage(variation);
  }

  const [isProcessing, setIsProcessing] = useState(false);

async function handleConfirmVariation(index: number) {
  if (isProcessing) return; // Impede chamadas duplicadas
  setIsProcessing(true);

  console.log("Iniciando handleConfirmVariation");
  
  if (!socketio) {
    console.log("SocketIO não está disponível.");
    return;
  }

  console.log("Antes do emit:", {
    variation: index + 1,
    buttonMessageId: generatedImages.buttonMessageId,
    reference: generatedImages.reference
  });

  socketio.emit('ia_upscale_variation', {
    variation: index + 1,
    buttonMessageId: generatedImages.buttonMessageId,
    reference: generatedImages.reference
  });

  console.log("Depois do emit");

  on2Close();
  setIsProcessing(false);
}


  async function sendPrompt() {
    if (!selectedTheme|| !userData.image) {
      console.error("Dados incompletos para enviar o prompt");
      return;
    }
    if (!(selectedTheme || userData.image)) return;
    if (!(socketState == 'connceted')) return;
    if (!(socketio)) return;

    on2Open();

    socketio.emit('generate_image', {
      tema: { ...selectedTheme },
      user: { ...userData }
    });

    console.log("Geração de Imagem:", {
      tema: { ...selectedTheme },
      user: { ...userData }
    });
  }

  async function handleGallerySelectImage(imagedata: GalleryType) {
    setImageURL(`${imagedata.image}`);
    setUserData({ ...userData, image: imagedata.nome });
    onGalleryClose();
  }

  async function authenticateClient() {
    if (!(socketio)) return;

    socketio.emit('password', authData.password);
  }

  async function handleRequestImages() {
    if (!(socketio)) return;

    setGalleryImages([] as GalleryType[]);
    onGalleryOpen();
    socketio.emit('get_gallery');
  }

  useEffect(() => {
    // onAuthOpen();;
    onClose();
    on2Close();
    //ws://192.168.1.51:3003/
    //172.31.40.189 - SAMSUNG
    //10.153.40.23 - GALAXY
    const socket = io('ws://localhost:3003/', {
      auth: (cb) => {
        cb({
          token: "#d90045"
        });
      }
    });

    socket.on('connect', () => {
      setSocketState('connceted');

      //Solicitar os prompts
      // socket.emit('prompts');1
      // onOpen();
    });

    socket.on('set_gallery', (data) => {
      console.log('Dados recebidos no set_gallery:', data); // Verificar os dados recebidos
      onGalleryClose();
      setGalleryImages(data);
      onGalleryOpen();
    });
    

    socket.on('add_gallery', async (data) => {
      const lcgallery = galleryImages;

      setGalleryImages(lcgallery);
    });

    socket.on('set_gallery_update', () => {
      // setGalleryImages(data);
      if (isGalleryOpen) {
        socket.emit('get_gallery');
      }
      // onGalleryOpen();
    });

    socket.on('auth', (data) => { // responds to the checker
      onClose();
      on2Close();

      if (data) {
        if (data.state) {
          onAuthClose();

          onOpen();
          socket.emit('getPrompts');
        } else {
          onAuthOpen();
        }
      }
    });

    socket.on('disconnect', () => {
      setSocketState('disconnected');

      //Limpar os dados do usuário
      setAuthData({} as AuthType);
      setUserData({} as UserType);

      //Zerar os progressos
      setGenProgress(0);
      setGenerating(false);

      setPrintingImg({} as { state: boolean, image: string });
      setGenProgress(0);
      setGenerating(false);
      setGeneratedImages({} as GeneratedImagesType);
      setSelectGeneratedImage('');
      setImageURL('https://media.discordapp.net/attachments/1298032353234653234/1298038016215879700/eric.viinny_apenas_recrie_a_imagem_em_formato_de_cartoon_4k_ult_a853bb8e-9ccc-4d02-ae90-9daf801fa57a.png?ex=65193544&is=6517e3c4&hm=988d2f3dc418f6bb93317403376a7bb4f5bd9073170108cfe0203f4a1e4efa8a&=&width=662&height=662')
      setSelectedTheme({} as ThemesType);

      //Fechar todos modal
      onClose();
      on2Close();
      onAuthClose();
    });

    socket.on('setPrompts', (data) => {
      console.log('Recebido prompts:', data);
      //setCosplayThemes(data.cosplay);
      setCognaThemes(data.Educacao);
      //setNoCosplayThemes(data.nocosplay);
      //setGamesThemes(data.games);
    });

    socket.on('ia_generating', (data) => {
      on2Open();
      setGenerating(true);
      setGenProgress(0);
    });

    socket.on('ia_gen_error', (data) => {
      if (data.regenerate) {
        sendPrompt();
      }
    });

    socket.on('ia_progress', (data) => {
      setGenProgress(data);
    })

    socket.on('ia_variation', (data) => {
      console.log("data do ia_variation");
      console.log(data);
      //Fechando modals desnecessários
      onClose();
      onAuthClose();

      //Resetando dados de progresso
      setGenerating(false);
      setGenProgress(0);
      setGeneratedImages(data as GeneratedImagesType);

      //Abrindo modal de imagem
      on2Open();
    });

    socket.on('ia_printing', (data) => {
      setPrintingImg({
        ...data,
        image: `data:image/png;base64,${data.image}`
      });
    });

    setSocketIo(socket);

  }, []);

  function handleClosePrintingModal() {
    // Limpa os dados do usuário
    setUserData({} as UserType);
  
    // Zera os progressos
    setGenProgress(0);
    setGenerating(false);
  
    // Reseta os estados associados
    setPrintingImg({ state: false, image: '' });
    setGeneratedImages({} as GeneratedImagesType);
    setSelectGeneratedImage('');
    setSelectedTheme({} as ThemesType);
  
    // Fecha todos os modais
    onClose(); //fecha tudo no return
    on2Close();
    onAuthClose();
    onGalleryClose();

    if (!(socketio)) return;
      console.log("chamando reiniciar")
      socketio.emit('reiniciar');
    
    console.log('Modal fechado e estados resetados.');

    // Reinicia a página
    //window.location.reload();
  }


  interface InputsType {
    nome: string;
    telefone: string;
  }
  


    
  return (
    <main className="w-screen h-screen relative">
      <div className="w-full min-h-full bg-[#242322] p-10">
        <div className="sm:flex gap-4 mb-4 items-center">
          <Card
            isFooterBlurred
            radius="lg"
            className="border-none h-fit"
          >
            <Image
              alt="User picture"
              className="object-cover md:w-[400px] min-h-[100px] max-h-[400px]"
              // height={200}
              src={imageURL}
            // width={'200px'}
            />
            <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
              <p className="text-tiny text-white/80">Alterar foto</p>
              <Button onPress={handleRequestImages} className="text-tiny text-white bg-black/20" variant="flat" color="default" radius="lg" size="sm">
                Procurar
              </Button>
            </CardFooter>
          </Card>

          <div className="mb-4">
            <Image width={'300px'} src="/logosamsung.png" />
            <div className="flex gap-2 ml-[10px] mt-2">
              <Chip color="danger" variant="flat">#IAPIC</Chip>
              <Chip color="secondary" variant="flat">#PICBRAND</Chip>
              <Chip color="primary" variant="flat">#Google</Chip>
            </div>
            <div className="mt-4 ml-[10px]">
              <h2 className="text-white font-medium text-[24px]">Escolha um tema</h2>
              <p className="text-slate-300 text-[18px]">O Tema define qual o resultado final da imagem</p>
              <div className="flex items-center h-[25px]">
                <div className="relative">
                  <div className={`ringball z-10 bg-${socketState == 'connceted' ? 'success' : 'danger'}`}></div>
                  <div className={`ringcircle z-10 bg-${socketState == 'connceted' ? 'success' : 'danger'}`}></div>
                </div>
                <small className="ml-2">
                  {socketState == 'connceted' ? 'Conectado ao' : 'Desconectado do'} servidor
                </small>
              </div>
              {
                  selectedTheme.value && (
                    <div className="bottom-5 p-4 z-10">
                      <Button color="primary" variant="shadow" onPress={() => sendPrompt()}>
                        GERAR IMAGEM
                      </Button>
                    </div>
                  )
                }
            </div>
          </div>
        </div>

        <Tabs
          fullWidth
          aria-label="Options"
          color="primary"
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-[#22d3ee]",
            tab: "max-w-fit px-0 h-12",
            tabContent: "mt-4 group-data-[selected=true]:text-[#06b6d4]"
          }}
        >
          <Tab
            key="Educacao"
            title={
              <div className="flex items-center space-x-2">
                <GalleryIcon />
                <span>Google</span>
                <Chip size="sm" variant={`faded`}>{CognaThemes.length}</Chip>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {
                CognaThemes.map((cp, index) => {
                  return (
                    <Card className={`py-4 ${selectedTheme === cp ? 'border-2 border-solid border-primary' : ''}`} key={index} isPressable onPress={() => selectTheme(cp)}>
                      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <h4 className="font-bold text-large">{cp.value}</h4>
                        <small className="text-default-500">{cp.description}</small>
                      </CardHeader>
                      <CardBody className="overflow-visible py-2">
                        <Image
                          alt="Card background"
                          className="object-cover rounded-xl"
                          src={cp.images}
                          width={270}
                          loading="lazy"
                        />
                      </CardBody>
                    </Card>
                  )
                })
              }
            </div>
          </Tab>
          
        </Tabs>
      </div>

      

      <Modal isOpen={isAuthOpen} onOpenChange={onAuthOpenChange} isDismissable={false} hideCloseButton>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">PicBrand • Autenticação</ModalHeader>
              <ModalBody>
                <Input
                  disabled
                  isRequired
                  label={"Senha"}
                  value={authData.password}
                  type={'password'}
                  defaultValue={authData.password}
                  onChange={() => { }}
                // onChange={(e) => setUserData({ ...userData, whatsapp: e.target.value })}
                />

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}1` })}
                  >1</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}2` })}
                  >2</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}3` })}
                  >3</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}4` })}
                  >4</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}5` })}
                  >5</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}6` })}
                  >6</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}7` })}
                  >7</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}8` })}
                  >8</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}9` })}
                  >9</Button>
                  <Button
                    className="font-bold text-[14px] text-center h-[48px]"
                    variant={'flat'}
                    color={'danger'}
                    onClick={() => setAuthData({ password: `${authData.password.slice(0, authData.password.length - 1)}` })}
                  >APAGAR</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}0` })}
                  >0</Button>
                  <Button
                    className="font-bold text-[14px] text-center h-[48px]"
                    variant={'flat'}
                    color={'success'}
                    onClick={authenticateClient}
                  >CONFIRMAR</Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} hideCloseButton>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">IA • Adicionar Usuário</ModalHeader>
              <ModalBody>
                <Select
                  isRequired
                  label="Gênero"
                  placeholder="Selecione o gênero"
                  onChange={(e) => setUserData({ ...userData, genero: e.target.value as 'masculino' | 'feminino' | 'outro' })}
                >
                  <SelectItem key={'feminino'} value={'feminino'}>
                    Feminino
                  </SelectItem>
                  <SelectItem key={'masculino'} value={'masculino'}>
                    Masculino
                  </SelectItem>
                  <SelectItem key={'outro'} value={'outro'}>
                    Outro
                  </SelectItem>
                </Select>
                <Card
                  isFooterBlurred
                  radius="lg"
                  className="border-none"
                >
                  <Image
                    alt="Woman listing to music"
                    className="object-cover min-h-[100px] max-h-[400px]"
                    // height={200}
                    src={imageURL}
                    width={'100%'}
                  />
                

                <CardFooter className="justify-between before:bg-white/10 border-white/60 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10 mt-4 mb-4">
                  <p className="text-tiny text-white/80">Alterar foto</p>
                  <Button
                    onPress={handleRequestImages}
                    className="text-tiny text-white bg-black/20"
                    variant="flat"
                    color="default"
                    radius="lg"
                    size="sm"
                  >
                    Procurar
                  </Button>
                </CardFooter>



                </Card>
              </ModalBody>
              {
                (selectedTheme && userData.image) && (
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button color="primary" onPress={() => { onClose(); }}>
                      Escolher Tema
                    </Button>
                  </ModalFooter>
                )
              }
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={is2Open} onOpenChange={on2OpenChange} isDismissable={false} hideCloseButton={true}>
  <ModalContent>
    {(on2Close) => (
      <>
        <ModalHeader className="flex flex-col gap-1">
          IA • {generating ? 'Gerando fotos' : 'Selecionar Foto'}
        </ModalHeader>
        <ModalBody>
          {printingImg.state ? (
            <div className="flex flex-col items-center gap-4">
              <Image src={printingImg.image} width={'600px'} />
              <p className="text-[18px] text-center">IMPRIMINDO FOTO</p>
            </div>
          ) : (
            <>
              {generating ? (
                <>
                  <Spinner size="lg" color="primary" />
                  <Progress
                    aria-label="Gerando..."
                    size="md"
                    value={genProgress}
                    color="primary"
                    showValueLabel={true}
                    isStriped
                    className="max-w-md mt-2"
                  />
                </>
              ) : (
                <div className="flex grid grid-cols-2 gap-4">
                  {generatedImages &&
                    generatedImages.variations &&
                    generatedImages.variations.map((variation, index) => {
                      return (
                        <div
                          key={index}
                          className={`overflow-hidden relative rounded-2xl ${
                            selectGeneratedImage == variation
                              ? 'border-2 border-solid border-primary'
                              : ''
                          }`}
                          onClick={() => handleSelectGeneratedImage(variation)}
                        >
                          {selectGeneratedImage == variation ? (
                            <div
                              className="absolute z-10"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0, 0, 0, 0.5)',
                                top: '0',
                                left: '0',
                              }}
                              onClick={() => handleConfirmVariation(index)}
                            >
                              <BiSolidChevronsDown style={{ fontSize: '32px' }} />
                              <p className="text-[18px]">SELECIONAR FOTO</p>
                            </div>
                          ) : (
                            <Image src={variation} width={'900px'} />
                          )}
                        </div>
                      );
                    })}
                  {generatedImages &&
                    generatedImages.variations &&
                    generatedImages.variations.length <= 0 && (
                      <div className="flex items-center justify-center">
                        <Spinner size="lg" color="primary" />
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClosePrintingModal}>
            Fechar
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>


      <Modal isOpen={isGalleryOpen} onOpenChange={onGalleryOpenChange} isDismissable={false} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onGalleryClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">IA • Galeria de Fotos</ModalHeader>
              <ModalBody>
                {
                  galleryImages.length <= 0 && (
                    <div className="w-full flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
                    </div>
                  )
                }
                <div className="grid grid-cols-3 gap-4">
                  {
                    galleryImages.map((gg, index) => {
                      console.log('Teste de URL da imagem:', gg.image); // Verificar URLs
                      return (
                        <Image
                          key={index}
                          src={`${gg.image}`}
                          width={'250px'}
                          onClick={() => handleGallerySelectImage(gg)}
                        />
                      )
                    })
                    
                  }
                </div>
              </ModalBody>
              <ModalFooter>
                By <b>PicBrand</b>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  )
}



/*






"use client"
import React, { useEffect, useRef, useState } from "react";
import { Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Card, CardFooter, Tabs, Tab, Select, SelectItem, Chip, CardHeader, CardBody, Input, Spinner, Progress } from "@nextui-org/react";
import { extname } from "path";
import { GalleryIcon } from "./GalleryIcon";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client";
import { BiSolidChevronsDown } from 'react-icons/bi';
import { VirtualKeyboard } from './teclado';

type ThemesType = {
  images: string;
  description: string;
  value: string;
}

type UserType = {
  username: string;
  whatsapp: string;
  image: any;
  genero: 'masculino' | 'feminino' | 'outro';
} & {
  [key: string]: any; // Permite propriedades dinâmicas
};

type GeneratedImagesType = {
  main: string;
  variations: string[];
  buttonMessageId: string;
  reference: string;
}

type AuthType = {
  password: string
}

type GalleryType = {
  nome: string,
  caminho: string,
  image: string
}

export default function Home() {

  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onOpenChange: onAuthOpenChange, onClose: onAuthClose } = useDisclosure();


  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { isOpen: is2Open, onOpen: on2Open, onOpenChange: on2OpenChange, onClose: on2Close } = useDisclosure();
  const { isOpen: isGalleryOpen, onOpen: onGalleryOpen, onOpenChange: onGalleryOpenChange, onClose: onGalleryClose } = useDisclosure();

  const [userData, setUserData] = useState<UserType>({} as UserType);
  const [authData, setAuthData] = useState<AuthType>({} as AuthType);

  const [printingImg, setPrintingImg] = useState<{ state: boolean, image: string }>({ state: false, image: '' });
  const [genProgress, setGenProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImagesType>({} as GeneratedImagesType);
  const [selectGeneratedImage, setSelectGeneratedImage] = useState<any>(undefined);

  const [socketio, setSocketIo] = useState<Socket>();
  const [socketState, setSocketState] = useState<'connceted' | 'disconnected'>('disconnected');
  const [imageURL, setImageURL] = useState<any>('https://media.discordapp.net/attachments/1298032353234653234/1298038016215879700/eric.viinny_apenas_recrie_a_imagem_em_formato_de_cartoon_4k_ult_a853bb8e-9ccc-4d02-ae90-9daf801fa57a.png?ex=65193544&is=6517e3c4&hm=988d2f3dc418f6bb93317403376a7bb4f5bd9073170108cfe0203f4a1e4efa8a&=&width=662&height=662');

  const [galleryImages, setGalleryImages] = useState<GalleryType[]>([] as GalleryType[]);

  const [CognaThemes, setCognaThemes] = useState<ThemesType[]>([] as ThemesType[]);
  //const [cosplayThemes, setCosplayThemes] = useState<ThemesType[]>([] as ThemesType[]);
  //const [noCosplayThemes, setNoCosplayThemes] = useState<ThemesType[]>([] as ThemesType[]);
  //const [gamesThemes, setGamesThemes] = useState<ThemesType[]>([] as ThemesType[]);

  const [selectedTheme, setSelectedTheme] = useState<ThemesType>({} as ThemesType);

  const [activeField, setActiveField] = useState<string | null>(null);

  

  const [inputs, setInputs] = useState<InputsType>({
    nome: '',
    telefone: ''
  });

  const handleInputChange = (field: keyof UserType, updateValue: (prevValue: string) => string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: updateValue(prev[field] || ""),
    }));
  };
  

  async function selectTheme(theme: ThemesType) {
    setSelectedTheme(theme);
  }

  async function handleSelectGeneratedImage(variation: string) {
    setSelectGeneratedImage(variation);
  }

  const [isProcessing, setIsProcessing] = useState(false);

async function handleConfirmVariation(index: number) {
  if (isProcessing) return; // Impede chamadas duplicadas
  setIsProcessing(true);

  console.log("Iniciando handleConfirmVariation");
  
  if (!socketio) {
    console.log("SocketIO não está disponível.");
    return;
  }

  console.log("Antes do emit:", {
    variation: index + 1,
    buttonMessageId: generatedImages.buttonMessageId,
    reference: generatedImages.reference
  });

  socketio.emit('ia_upscale_variation', {
    variation: index + 1,
    buttonMessageId: generatedImages.buttonMessageId,
    reference: generatedImages.reference
  });

  console.log("Depois do emit");

  on2Close();
  setIsProcessing(false);
}


  async function sendPrompt() {
    if (!selectedTheme || !userData.username || !userData.whatsapp || !userData.image) {
      console.error("Dados incompletos para enviar o prompt");
      return;
    }
    if (!(selectedTheme || userData.username || userData.whatsapp || userData.image)) return;
    if (!(socketState == 'connceted')) return;
    if (!(socketio)) return;

    on2Open();

    socketio.emit('generate_image', {
      tema: { ...selectedTheme },
      user: { ...userData }
    });

    console.log("Geração de Imagem:", {
      tema: { ...selectedTheme },
      user: { ...userData }
    });
  }

  async function handleGallerySelectImage(imagedata: GalleryType) {
    setImageURL(`${imagedata.image}`);
    setUserData({ ...userData, image: imagedata.nome });
    onGalleryClose();
  }

  async function authenticateClient() {
    if (!(socketio)) return;

    socketio.emit('password', authData.password);
  }

  async function handleRequestImages() {
    if (!(socketio)) return;

    setGalleryImages([] as GalleryType[]);
    onGalleryOpen();
    socketio.emit('get_gallery');
  }

  useEffect(() => {
    // onAuthOpen();;
    onClose();
    on2Close();
    //ws://192.168.1.51:3003/
    //172.31.40.189 - SAMSUNG
    //10.153.40.23 - GALAXY
    const socket = io('ws://localhost:3003/', {
      auth: (cb) => {
        cb({
          token: "#d90045"
        });
      }
    });

    socket.on('connect', () => {
      setSocketState('connceted');

      //Solicitar os prompts
      // socket.emit('prompts');1
      // onOpen();
    });

    socket.on('set_gallery', (data) => {
      console.log('Dados recebidos no set_gallery:', data); // Verificar os dados recebidos
      onGalleryClose();
      setGalleryImages(data);
      onGalleryOpen();
    });
    

    socket.on('add_gallery', async (data) => {
      const lcgallery = galleryImages;

      setGalleryImages(lcgallery);
    });

    socket.on('set_gallery_update', () => {
      // setGalleryImages(data);
      if (isGalleryOpen) {
        socket.emit('get_gallery');
      }
      // onGalleryOpen();
    });

    socket.on('auth', (data) => { // responds to the checker
      onClose();
      on2Close();

      if (data) {
        if (data.state) {
          onAuthClose();

          onOpen();
          socket.emit('getPrompts');
        } else {
          onAuthOpen();
        }
      }
    });

    socket.on('disconnect', () => {
      setSocketState('disconnected');

      //Limpar os dados do usuário
      setAuthData({} as AuthType);
      setUserData({} as UserType);

      //Zerar os progressos
      setGenProgress(0);
      setGenerating(false);

      setPrintingImg({} as { state: boolean, image: string });
      setGenProgress(0);
      setGenerating(false);
      setGeneratedImages({} as GeneratedImagesType);
      setSelectGeneratedImage('');
      setImageURL('https://media.discordapp.net/attachments/1298032353234653234/1298038016215879700/eric.viinny_apenas_recrie_a_imagem_em_formato_de_cartoon_4k_ult_a853bb8e-9ccc-4d02-ae90-9daf801fa57a.png?ex=65193544&is=6517e3c4&hm=988d2f3dc418f6bb93317403376a7bb4f5bd9073170108cfe0203f4a1e4efa8a&=&width=662&height=662')
      setSelectedTheme({} as ThemesType);

      //Fechar todos modal
      onClose();
      on2Close();
      onAuthClose();
    });

    socket.on('setPrompts', (data) => {
      console.log('Recebido prompts:', data);
      //setCosplayThemes(data.cosplay);
      setCognaThemes(data.Educacao);
      //setNoCosplayThemes(data.nocosplay);
      //setGamesThemes(data.games);
    });

    socket.on('ia_generating', (data) => {
      on2Open();
      setGenerating(true);
      setGenProgress(0);
    });

    socket.on('ia_gen_error', (data) => {
      if (data.regenerate) {
        sendPrompt();
      }
    });

    socket.on('ia_progress', (data) => {
      setGenProgress(data);
    })

    socket.on('ia_variation', (data) => {
      console.log("data do ia_variation");
      console.log(data);
      //Fechando modals desnecessários
      onClose();
      onAuthClose();

      //Resetando dados de progresso
      setGenerating(false);
      setGenProgress(0);
      setGeneratedImages(data as GeneratedImagesType);

      //Abrindo modal de imagem
      on2Open();
    });

    socket.on('ia_printing', (data) => {
      setPrintingImg({
        ...data,
        image: `data:image/png;base64,${data.image}`
      });
    });

    setSocketIo(socket);

  }, []);

  function handleClosePrintingModal() {
    // Limpa os dados do usuário
    setUserData({} as UserType);
  
    // Zera os progressos
    setGenProgress(0);
    setGenerating(false);
  
    // Reseta os estados associados
    setPrintingImg({ state: false, image: '' });
    setGeneratedImages({} as GeneratedImagesType);
    setSelectGeneratedImage('');
    setSelectedTheme({} as ThemesType);
  
    // Fecha todos os modais
    onClose(); //fecha tudo no return
    on2Close();
    onAuthClose();
    onGalleryClose();

    if (!(socketio)) return;
      console.log("chamando reiniciar")
      socketio.emit('reiniciar');
    
    console.log('Modal fechado e estados resetados.');

    // Reinicia a página
    //window.location.reload();
  }


  interface InputsType {
    nome: string;
    telefone: string;
  }
  


    
  return (
    <main className="w-screen h-screen relative">
      <div className="w-full min-h-full bg-[#242322] p-10">
        <div className="sm:flex gap-4 mb-4 items-center">
          <Card
            isFooterBlurred
            radius="lg"
            className="border-none h-fit"
          >
            <Image
              alt="User picture"
              className="object-cover md:w-[400px] min-h-[100px] max-h-[400px]"
              // height={200}
              src={imageURL}
            // width={'200px'}
            />
            <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
              <p className="text-tiny text-white/80">Alterar foto</p>
              <Button onPress={handleRequestImages} className="text-tiny text-white bg-black/20" variant="flat" color="default" radius="lg" size="sm">
                Procurar
              </Button>
            </CardFooter>
          </Card>

          <div className="mb-4">
            <Image width={'300px'} src="/logosamsung.png" />
            <div className="flex gap-2 ml-[10px] mt-2">
              <Chip color="danger" variant="flat">#IAPIC</Chip>
              <Chip color="secondary" variant="flat">#PICBRAND</Chip>
              <Chip color="primary" variant="flat">#COGNA</Chip>
            </div>
            <div className="mt-4 ml-[10px]">
              <h2 className="text-white font-medium text-[24px]">Escolha um tema</h2>
              <p className="text-slate-300 text-[18px]">O Tema define qual o resultado final da imagem</p>
              <div className="flex items-center h-[25px]">
                <div className="relative">
                  <div className={`ringball z-10 bg-${socketState == 'connceted' ? 'success' : 'danger'}`}></div>
                  <div className={`ringcircle z-10 bg-${socketState == 'connceted' ? 'success' : 'danger'}`}></div>
                </div>
                <small className="ml-2">
                  {socketState == 'connceted' ? 'Conectado ao' : 'Desconectado do'} servidor
                </small>
              </div>
              {
                  selectedTheme.value && userData.username && userData.whatsapp && (
                    <div className="bottom-5 p-4 z-10">
                      <Button color="primary" variant="shadow" onPress={() => sendPrompt()}>
                        GERAR IMAGEM
                      </Button>
                    </div>
                  )
                }
            </div>
          </div>
        </div>

        <Tabs
          fullWidth
          aria-label="Options"
          color="primary"
          variant="underlined"
          classNames={{
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-[#22d3ee]",
            tab: "max-w-fit px-0 h-12",
            tabContent: "mt-4 group-data-[selected=true]:text-[#06b6d4]"
          }}
        >
          <Tab
            key="Educacao"
            title={
              <div className="flex items-center space-x-2">
                <GalleryIcon />
                <span>Cogna</span>
                <Chip size="sm" variant={`faded`}>{CognaThemes.length}</Chip>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {
                CognaThemes.map((cp, index) => {
                  return (
                    <Card className={`py-4 ${selectedTheme === cp ? 'border-2 border-solid border-primary' : ''}`} key={index} isPressable onPress={() => selectTheme(cp)}>
                      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <h4 className="font-bold text-large">{cp.value}</h4>
                        <small className="text-default-500">{cp.description}</small>
                      </CardHeader>
                      <CardBody className="overflow-visible py-2">
                        <Image
                          alt="Card background"
                          className="object-cover rounded-xl"
                          src={cp.images}
                          width={270}
                          loading="lazy"
                        />
                      </CardBody>
                    </Card>
                  )
                })
              }
            </div>
          </Tab>
          
        </Tabs>
      </div>

      

      <Modal isOpen={isAuthOpen} onOpenChange={onAuthOpenChange} isDismissable={false} hideCloseButton>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">PicBrand • Autenticação</ModalHeader>
              <ModalBody>
                <Input
                  disabled
                  isRequired
                  label={"Senha"}
                  value={authData.password}
                  type={'password'}
                  defaultValue={authData.password}
                  onChange={() => { }}
                // onChange={(e) => setUserData({ ...userData, whatsapp: e.target.value })}
                />

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}1` })}
                  >1</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}2` })}
                  >2</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}3` })}
                  >3</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}4` })}
                  >4</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}5` })}
                  >5</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}6` })}
                  >6</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}7` })}
                  >7</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}8` })}
                  >8</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}9` })}
                  >9</Button>
                  <Button
                    className="font-bold text-[14px] text-center h-[48px]"
                    variant={'flat'}
                    color={'danger'}
                    onClick={() => setAuthData({ password: `${authData.password.slice(0, authData.password.length - 1)}` })}
                  >APAGAR</Button>
                  <Button
                    className="font-bold text-[18px] text-center h-[48px]"
                    variant={'flat'}
                    color={'default'}
                    onClick={() => setAuthData({ password: `${authData.password ? authData.password : ''}0` })}
                  >0</Button>
                  <Button
                    className="font-bold text-[14px] text-center h-[48px]"
                    variant={'flat'}
                    color={'success'}
                    onClick={authenticateClient}
                  >CONFIRMAR</Button>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} hideCloseButton>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">IA • Adicionar Usuário</ModalHeader>
              <ModalBody>
                <Input
                  isRequired
                  label={"Nome"}
                  value={userData.username}
                  type={'text'}
                  onFocus={() => setActiveField('username')}
                  
                  onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                />
                <Input
                  isRequired
                  label={"Whatsapp"}
                  value={userData.whatsapp}
                  type={'text'}
                  onFocus={() => setActiveField('whatsapp')}
                  
                  onChange={(e) => setUserData({ ...userData, whatsapp: e.target.value.trim() })}
                />
                <Select
                  isRequired
                  label="Gênero"
                  placeholder="Selecione o gênero"
                  onChange={(e) => setUserData({ ...userData, genero: e.target.value as 'masculino' | 'feminino' | 'outro' })}
                >
                  <SelectItem key={'feminino'} value={'feminino'}>
                    Feminino
                  </SelectItem>
                  <SelectItem key={'masculino'} value={'masculino'}>
                    Masculino
                  </SelectItem>
                  <SelectItem key={'outro'} value={'outro'}>
                    Outro
                  </SelectItem>
                </Select>
                <Card
                  isFooterBlurred
                  radius="lg"
                  className="border-none"
                >
                  <Image
                    alt="Woman listing to music"
                    className="object-cover min-h-[100px] max-h-[400px]"
                    // height={200}
                    src={imageURL}
                    width={'100%'}
                  />
                
                <VirtualKeyboard
                  targetInput={activeField}
                  onInputChange={handleInputChange}
                />

                <CardFooter className="justify-between before:bg-white/10 border-white/60 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10 mt-4 mb-4">
                  <p className="text-tiny text-white/80">Alterar foto</p>
                  <Button
                    onPress={handleRequestImages}
                    className="text-tiny text-white bg-black/20"
                    variant="flat"
                    color="default"
                    radius="lg"
                    size="sm"
                  >
                    Procurar
                  </Button>
                </CardFooter>



                </Card>
              </ModalBody>
              {
                (selectedTheme && userData.username && userData.whatsapp && userData.image) && (
                  <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancelar
                    </Button>
                    <Button color="primary" onPress={() => { onClose(); }}>
                      Escolher Tema
                    </Button>
                  </ModalFooter>
                )
              }
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={is2Open} onOpenChange={on2OpenChange} isDismissable={false} hideCloseButton={true}>
  <ModalContent>
    {(on2Close) => (
      <>
        <ModalHeader className="flex flex-col gap-1">
          IA • {generating ? 'Gerando fotos' : 'Selecionar Foto'}
        </ModalHeader>
        <ModalBody>
          {printingImg.state ? (
            <div className="flex flex-col items-center gap-4">
              <Image src={printingImg.image} width={'600px'} />
              <p className="text-[18px] text-center">IMPRIMINDO FOTO</p>
            </div>
          ) : (
            <>
              {generating ? (
                <>
                  <Spinner size="lg" color="primary" />
                  <Progress
                    aria-label="Gerando..."
                    size="md"
                    value={genProgress}
                    color="primary"
                    showValueLabel={true}
                    isStriped
                    className="max-w-md mt-2"
                  />
                </>
              ) : (
                <div className="flex grid grid-cols-2 gap-4">
                  {generatedImages &&
                    generatedImages.variations &&
                    generatedImages.variations.map((variation, index) => {
                      return (
                        <div
                          key={index}
                          className={`overflow-hidden relative rounded-2xl ${
                            selectGeneratedImage == variation
                              ? 'border-2 border-solid border-primary'
                              : ''
                          }`}
                          onClick={() => handleSelectGeneratedImage(variation)}
                        >
                          {selectGeneratedImage == variation ? (
                            <div
                              className="absolute z-10"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0, 0, 0, 0.5)',
                                top: '0',
                                left: '0',
                              }}
                              onClick={() => handleConfirmVariation(index)}
                            >
                              <BiSolidChevronsDown style={{ fontSize: '32px' }} />
                              <p className="text-[18px]">SELECIONAR FOTO</p>
                            </div>
                          ) : (
                            <Image src={variation} width={'900px'} />
                          )}
                        </div>
                      );
                    })}
                  {generatedImages &&
                    generatedImages.variations &&
                    generatedImages.variations.length <= 0 && (
                      <div className="flex items-center justify-center">
                        <Spinner size="lg" color="primary" />
                      </div>
                    )}
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={handleClosePrintingModal}>
            Fechar
          </Button>
        </ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>


      <Modal isOpen={isGalleryOpen} onOpenChange={onGalleryOpenChange} isDismissable={false} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onGalleryClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">IA • Galeria de Fotos</ModalHeader>
              <ModalBody>
                {
                  galleryImages.length <= 0 && (
                    <div className="w-full flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
                    </div>
                  )
                }
                <div className="grid grid-cols-3 gap-4">
                  {
                    galleryImages.map((gg, index) => {
                      console.log('Teste de URL da imagem:', gg.image); // Verificar URLs
                      return (
                        <Image
                          key={index}
                          src={`${gg.image}`}
                          width={'250px'}
                          onClick={() => handleGallerySelectImage(gg)}
                        />
                      )
                    })
                    
                  }
                </div>
              </ModalBody>
              <ModalFooter>
                By <b>PicBrand</b>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </main>
  )
}*/