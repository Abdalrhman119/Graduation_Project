using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Contracts
{
    public interface IGenericRepository<T> where T : class
    {


        Task AddAsync(T entity);

        void Update(T entity);

        void Delete(T entity);
        Task<T> GetByIdAsync(int id);
        Task<IReadOnlyList<T>> GetAllAsync();


    }
}
