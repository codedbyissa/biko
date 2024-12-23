import Cookie from 'js-cookie';
import React from 'react';
import feed from '../styles/feed.module.css';
import publi from '../styles/ultils/publications.module.css';
import cselector from '../styles/ultils/categorySelector.module.css';
import { useState, useEffect } from 'react';
import { Publication, newPublication, filterPublication } from '../models/Publication';
import { PublicationService } from '../services/publicationService';
import { IBGEService } from '../services/ibgeService';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { TailSpin } from 'react-loader-spinner';
import { User } from '../models/User';
import { UserService } from '../services/userService';
import { Category } from '../models/Category';
import { CategoryService } from '../services/categoryService';
import { State } from '../models/State';
import { City } from '../models/City';
import Options from './ultils/Options';
import ModalConfirm from "./ultils/ModalConfirm";

export default function FeedPage() {

  const router = useRouter();
  const [writePost, setWritePost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataPublications, setDataPublications] = useState<Publication[]>([]);
  const token:string|undefined = Cookie.get('token');
  const [user, setUser] = useState<User>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openCategories, setOpenCategories] = useState(false);
  const [openCategoriesFilter, setOpenCategoriesFilter] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [modalProps, setModalProps] = useState({
    open: false,
    onClose: () => setModalProps((prev) => ({ ...prev, open: false })),
    onConfirm: () => {},
    title: '',
    message: ''
  });
  const [newPublication, setNewPublication] = useState<newPublication>({
    title: '',
    text: '',
    type: 0,
    categories: []
  });
  const [filter, setFilter] = useState<filterPublication>({
    search: '',
    type: '',
    categories: [],
    orderBy: 'desc',
    state: '',
    city: '',
    neighborhood: ''
  });

  useEffect(() => {
      const getUser = async () => {
        try {
          const data:any = await UserService.getAuthUser(token);
          setUser(data);
        } catch (error:any) {
          if(error.status == 401){ 
            console.error('Erro:', error);
            toast.info("Desconectado", {
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
            Cookie.remove('token');
            router.push('/');
          }
        }
      }

      const loadCategories = async() => {
        const data = await CategoryService.getCategories();
        setCategories(data);
      }

      const loadStates = async() => {
        const data = await IBGEService.getStates();
        setStates(data);
      }

      getUser();
      loadCategories();
      loadStates();
  }, []);

  useEffect(() => {
      const getPublications = async () => {
        try {
          const data:any = await PublicationService.getPublications(filter, token);
          setDataPublications(data.data);
          setLoading(false);
        } catch (error:any) {
          if(error.status == 401){ 
            console.error('Erro:', error);
            toast.error(error, {
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
          }
        }
      };
      getPublications();
  }, [loading]);

  useEffect(() => {
    const loadCities = async(id:string) => {
        const data = await IBGEService.getCities(id);
        setCities(data);
    }

    const index = states.findIndex(i => i.nome == filter.state);
    if(index > -1) loadCities((states[index].id).toString());

  }, [filter.state])

  const openModal = (title: string, message: string, onConfirm: () => void) => {
    setModalProps((prev) => ({
      ...prev,
      open: true,
      onConfirm,
      title,
      message,
    }));
  };

  const publicationChange = (e:any) => {
    const { name, value } = e.target;
    setNewPublication((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const FilterChange = (e:any) => {
    const { name, value } = e.target;
    setFilter((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleStateChange = async(e:any) => {
    setFilter((prevState) => ({
      ...prevState,
      state: e.target.value,
      city: ''
    }));
  }

  const handleChangeCategories = async(categoryID:number) => {
    const exist = newPublication.categories.includes(categoryID);
    setNewPublication((prevState) => ({
      ...prevState,
      categories: exist
        ? prevState.categories.filter((id) => id !== categoryID)
        : [...prevState.categories, categoryID]
    }));
  }

  const handleChangeCategoriesFilter = async(categoryID:number) => {
    const exist = filter.categories.includes(categoryID);
    setFilter((prevState) => ({
      ...prevState,
      categories: exist
        ? prevState.categories.filter((id) => id !== categoryID)
        : [...prevState.categories, categoryID]
    }));
  }
      
  const publish = async () => {
      const toast_id = toast.loading('Publicando, aguarde...', {
          position: "top-right",
      });
      try {
          const data:any = await PublicationService.createPublication(newPublication, token);
          if (data.success) {
            toast.update(toast_id, {
              render: "Anúncio publicado com sucesso!",
              type: "success",
              isLoading: false,
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
            setOpenCategories(false);
            setWritePost(false);
            setNewPublication({
              title: '',
              text: '',
              type: 0,
              categories: []
            });
          } else {
            toast.update(toast_id, {
              render: data.message,
              type: "error",
              isLoading: false,
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "dark",
            });
          }
          setLoading(true);
      } catch (error) {
          console.error('Erro ao publicar o anúncio:', error);
      }
  }

  const deletePublication = async(id:number) => {
    setModalProps((prev) => ({ ...prev, open: false }))
    const toast_id = toast.loading('Excluindo, aguarde...', {
      position: "top-right",
    });
    
  try {
      const data:any = await PublicationService.deletePublication(id, token);
      if (data.success) {
        toast.update(toast_id, {
          render: "Publicação excluida com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      } else {
        toast.update(toast_id, {
          render: data.message,
          type: "error",
          isLoading: false,
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      setLoading(true);
  } catch (error) {
      console.error('Erro ao publicar o anúncio:', error);
  } 
  }

  const openPublication = async(id:number) => {
    router.push(`/posts/${id}`);
  }

  const checkRequerimentsPublish = () => {
    if(newPublication.title.trim().length < 1){
      toast.error('Dê um título a postagem', {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      return;
    }

    if(newPublication.text.trim().length < 1){
      toast.error('Escreva um texto para a postagem', {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      return;
    }

    if(newPublication.categories.length < 1){
      toast.error('Escolha pelo menos uma categoria para a postagem', {
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });

      return;
    }

    publish();
  }
    
  const cancelPublish = () => {
    setWritePost(false);
    setOpenCategories(false);
    setNewPublication({
      title: '',
      text: '',
      type: 0,
      categories: []
    });
  }

  const filterPublications = () => {
    setOpenCategoriesFilter(false)
    setLoading(true);
  }

  const updateLike = async (pubID: number) => {
    try {
      setDataPublications(prevPublications => 
        prevPublications.map(publication => {
            if (publication.id === pubID) {
                const hasLiked = publication.likes.some(like => like.user_id === user?.id);
                return {
                    ...publication,
                    likes: hasLiked
                        ? publication.likes.filter(like => like.user_id !== user?.id)
                        : [...publication.likes, { id: Date.now(), user_id: user?.id, publication_id: pubID, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] // Use valores padrão
                };
            }
            return publication;
        })
      );

      const data: any = await PublicationService.likePublication(pubID, token);
      if (!data.success) {
        throw new Error('Erro ao atualizar like');
      }
    } catch (error: any) {
        if (error.status === 401) {
            console.error('Erro:', error);
            toast.error(error, {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
            });
        }
    }
};

  const renderPublications = () => {
    return (
        <div className={publi.publications}>
          {dataPublications.map(publication => {
            const formatDate = (value:string) => {
              const publicationDate = new Date(value);
              const now = new Date();
              const diffInMs = now.getTime() - publicationDate.getTime();
              const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
              const diffInHours = Math.floor(diffInMinutes / 60);
            
              if (diffInMinutes < 60) {
                return `${diffInMinutes} minutos atrás`;
              } else if (diffInHours < 24) {
                return `${diffInHours} horas atrás`;
              } else {
                return publicationDate.toLocaleDateString('pt-BR');
              }
            };
    
            return (
              <div key={publication.id} className={publi.publication}>
                <div className={publi.publicationContainer}>
                  <div className={publi.header}>
                      <div className={publi.author}>
                          <i className={`bi bi-person-circle`}></i>
                          <h3>{publication.author.name}</h3>
                          <span>{publication.type === 0? 'cliente' : 'prestador de serviços'}</span>
                      </div>
                      <div className={publi.corner}>
                          <p>{formatDate(publication.created_at)}</p>
                          <Options 
                            trigger={<i className={"bi bi-three-dots-vertical"}></i>}
                            items={[
                              {label: 'Abrir Publicação', onClick: () => openPublication(publication.id) },
                              ...(publication.author.id === user?.id ?
                                [{ label: 'Excluir Publicação', onClick: () => openModal('Confirmação de Exclusão', 'Você está prestes a excluir esta publicação. Essa ação é irreversível. Tem certeza de que deseja continuar?', () => { deletePublication(publication.id) }) }] :
                              [])
                            ]}/>
                      </div>
                  </div>
                  <div className={publi.publicationContent}>
                      <h2>{publication.title}</h2>
                      <p> {publication.text.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                      </p>
                  </div>
                  <div className={publi.tags}>
                    {publication.categories.map((category) => (
                      <p key={category.id}>{category.name}</p>
                    ))}
                  </div>
                  <div className={publi.footer}>
                      <div className={publi.items}>
                        <div className={publi.item}>
                            <i className={`bi bi-chat-left`} onClick={() => openPublication(publication.id)}></i>
                            <p>{publication.comments.length} comentários</p>
                        </div>
                        <div className={publi.item}>
                            <i className={`bi bi-hand-thumbs-up${user && publication.likes.find(like => like.user_id == user.id) ? '-fill' : ''}`} onClick={() => updateLike(publication.id)}></i>
                            <p>{publication.likes.length} curtidas</p>
                        </div>
                      </div>
                      {/* <div className={publi.openCommentsContainer}>
                        <div className={publi.openComments}>
                          <p>Abrir comentarios</p>
                          <i className={"bi bi-chevron-down"}></i>
                        </div>
                      </div> */}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
    );
  };
 
  const renderWritePost = () => {
    return (
      <div className={feed.writePost}>
        <div className={feed.textarea}>
            <input type="text" id="title" name="title" placeholder="Crie um título" onChange={publicationChange} style={!writePost ? { display: 'none' } : {}} value={newPublication.title}/>
            <textarea id="text" name="text" placeholder="Quer anunciar algo?" style={writePost ? { height: '200px' } : {}} onFocus={() => { setWritePost(true)}} onChange={publicationChange} value={newPublication.text}></textarea>
            <div className={feed.shortcuts} style={!writePost ? { display: 'none' } : {}}>
                <div className={feed.attach}>
                    <i className={`bi bi-image`}></i>
                    <p>Anexar Mídia</p>
                </div>
                <div className={feed.customField}>
                  <div className={feed.selectContainer}>
                    <p>Anunciar como: </p>
                    <select name="type" id="type" value={newPublication.type} onChange={publicationChange}>
                      <option value="0">Cliente</option>
                      <option value="1">Prestador</option>
                    </select>
                  </div>
                </div>
                <div className={feed.customField}>
                  <div className={feed.selectContainer} onClick={() => setOpenCategories(openCategories? false : true)}>
                    <p>Escolha uma ou mais categorias relacionadas ao anúncio <span>{newPublication.categories.length}</span></p>
                    <i className={openCategories? "bi bi-caret-up-fill" : "bi bi-caret-down-fill"}></i>
                  </div>
                  {openCategories? <div className={cselector.categoriesContent}>
                  <p onClick={() => setNewPublication((prevState) => ({...prevState, categories: []}))}>Limpar seleção</p>
                  <div className={cselector.categories}>
                    {categories.map((category) => (
                        <div key={category.id} className={cselector.category} onClick={() => handleChangeCategories(category.id)}>
                          <div className={cselector.checkbox}>
                            <div className={cselector.box}>
                              <i className={newPublication.categories.includes(category.id)? "bi bi-check" : ""}></i>
                            </div>
                          </div>
                          <p>{category.name}</p>
                        </div>
                      ))}
                  </div>
                  </div> : ''}
                </div>
            </div>
        </div>
        <div className={feed.publish}>
            <button onClick={checkRequerimentsPublish} style={!writePost ? { display: 'none' } : {}}>Postar</button>
            <button onClick={cancelPublish} id="cancel" style={!writePost ? { display: 'none' } : {}}>Cancelar</button>
        </div>
      </div> 
    );
  };

  const renderHeader = () => {
    return (
      <div className={feed.header}>
        <h1>Publicações</h1>
        
        <div className={feed.search}>
          <div className={feed.customField}>
            <div className={feed.selectContainer}>
            <i className={"bi bi-search"}></i>
              <input type="search" name="search" id="search" placeholder='pesquisar...' onChange={FilterChange}/>
            </div>
          </div>

          <button onClick={filterPublications}>Buscar</button>
        </div>

        <div className={feed.filters}>
          <div className={feed.customField}>
            <div className={feed.selectContainer}>
              <p>Filtrar postagens por: </p>
              <select name="type" id="type" value={filter.type} onChange={FilterChange}>
                <option value="">todos</option>
                <option value="0">Cliente</option>
                <option value="1">Prestador</option>
              </select>
            </div>
          </div>

          <div className={feed.customField}>
            <div className={feed.selectContainer} onClick={() => setOpenCategoriesFilter(openCategoriesFilter? false : true)}>
              <p>Categorias relacionadas as postagens <span>{filter.categories.length > 0 ? filter.categories.length : 'todas'}</span></p>
              <i className={openCategoriesFilter? "bi bi-caret-up-fill" : "bi bi-caret-down-fill"}></i>
            </div>
            {openCategoriesFilter? <div className={cselector.categoriesContent}>
            <div className={cselector.categories}>
                  <div className={cselector.category} onClick={() => setFilter((prevState) => ({...prevState, categories: []}))}>
                    <div className={cselector.checkbox}>
                      <div className={cselector.box}>
                        <i className={filter.categories.length < 1? "bi bi-check" : ""}></i>
                      </div>
                    </div>
                    <p>Todas</p>
                  </div>
              {categories.map((category) => (
                  <div key={category.id} className={cselector.category} onClick={() => handleChangeCategoriesFilter(category.id)}>
                    <div className={cselector.checkbox}>
                      <div className={cselector.box}>
                        <i className={filter.categories.includes(category.id)? "bi bi-check" : ""}></i>
                      </div>
                    </div>
                    <p>{category.name}</p>
                  </div>
                ))}
            </div>
            </div> : ''}
          </div>
          
          <div className={feed.customField}>
            <div className={feed.selectContainer}>
              <p>Filtrar por local: </p>
              <select name="state" id="state" value={filter.state} onChange={handleStateChange}>
                <option selected value=''>Selecione estado</option>
                {states.map((state) => (
                    <option key={state.id} value={state.nome}> {state.nome} </option>
                ))}
              </select>
              <select name="city" id="city" value={filter.city} onChange={FilterChange}>
                <option selected value=''>Selecione cidade</option>
                {cities.map((city) => (
                    <option key={city.id} value={city.nome}> {city.nome} </option>
                ))}
              </select>
              <input type="text" name="neighborhood" id="neighborhood" placeholder='digite um bairro...' onChange={FilterChange}/>
            </div>
          </div>

          <div className={feed.customField}>
            <div className={feed.selectContainer}>
              <p>Ordenar por: </p>
              <select name="orderBy" id="orderBy" value={filter.orderBy} onChange={FilterChange}>
                <option value="desc">mais recente</option>
                <option value="asc">mais antigo</option>
                <option value="popular">em destaque</option>
              </select>
            </div>
          </div>
        </div>
      </div> 
    );
  }

  return (
      <div className={feed.feedContainer}>
            <ModalConfirm
            isOpen={modalProps.open}
            onClose={modalProps.onClose}
            onConfirm={modalProps.onConfirm}
            title={modalProps.title}
            message={modalProps.message}
          />
          {renderWritePost()}
          {renderHeader()}
          <div className={feed.feedContent}>
              { loading? 
                  <TailSpin
                  visible={true}
                  height="150"
                  width="150"
                  color="var(--secondary-bg-color)"
                  ariaLabel="tail-spin-loading"
                  radius="1"
                  wrapperStyle={{}}
                  wrapperClass=""/>  : 
                  renderPublications()
              }
          </div>
      </div>
  );
};